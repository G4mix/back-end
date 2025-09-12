import { Request, Response, NextFunction } from 'express'
import { Logger } from '@shared/utils/logger'
import { CommonErrors } from '@shared/utils/error-response'
import { DTORegistry } from '@shared/utils/dto-registry'
import { initializeAllDTOs } from '@shared/utils/dto-initializer'

/**
 * Middleware de validação automática global
 * 
 * Funcionalidades:
 * - Parse automático de dados de entrada (body, query, params)
 * - Validação robusta com Zod schemas
 * - Serialização automática de resposta
 * - Tratamento de erros centralizado
 * - Aplicação global sem decorators complexos
 */
export class AutoValidationMiddleware {
	private logger: Logger
	private dtoRegistry: DTORegistry

	constructor(logger: Logger) {
		this.logger = logger
		this.dtoRegistry = DTORegistry.getInstance(logger)
		// Inicialização assíncrona será feita no primeiro uso
		this.initializeDTOSchemas().catch(error => {
			this.logger.warn('Erro na inicialização assíncrona dos DTOs', { error })
		})
	}

	/**
	 * Inicializa schemas dos DTOs automaticamente
	 */
	private async initializeDTOSchemas(): Promise<void> {
		try {
			// Inicializa todos os DTOs automaticamente
			await initializeAllDTOs(this.logger)
			
			this.logger.info('DTOs inicializados automaticamente', {
				routes: this.dtoRegistry.listRoutes()
			})
		} catch (error) {
			this.logger.warn('Erro ao inicializar DTOs, usando schemas hardcoded', { error })
		}
	}

	/**
	 * Middleware principal que processa validação automaticamente
	 */
	process() {
		return (req: Request, res: Response, next: NextFunction) => {
			try {
				// Identifica a rota
				const routeKey = `${req.method} ${req.route?.path || req.path}`
				const schema = this.getSchemaForRoute(routeKey)

				if (!schema) {
					return next()
				}

				// Processa entrada (body, query, params) e injeta diretamente no request
				this.processInput(req, schema)

				// Intercepta resposta para serialização
				this.interceptResponse(res, schema)

				next()
			} catch (error) {
				this.handleValidationError(error, req, res)
			}
		}
	}

	/**
	 * Extrai o código de erro específico dos issues do Zod
	 */
	private extractErrorCode(issues: any[], fallbackCode: string): string {
		// Procura por erros com mensagens customizadas primeiro
		for (const issue of issues) {
			if (issue.message && issue.message !== 'Required' && issue.message !== 'Invalid input') {
				return issue.message
			}
		}

		// Se não encontrou mensagem customizada, tenta inferir pelo tipo de erro
		for (const issue of issues) {
			switch (issue.code) {
			case 'invalid_type':
				if (issue.expected === 'string' && issue.received === 'undefined') {
					return 'REQUIRED_FIELD'
				}
				return 'INVALID_TYPE'
			case 'too_small':
				if (issue.type === 'string') {
					return 'TOO_SHORT'
				}
				return 'TOO_SMALL'
			case 'too_big':
				if (issue.type === 'string') {
					return 'TOO_LONG'
				}
				return 'TOO_BIG'
			case 'invalid_string':
				if (issue.validation === 'email') {
					return 'INVALID_EMAIL'
				}
				if (issue.validation === 'url') {
					return 'INVALID_URL'
				}
				return 'INVALID_STRING'
			case 'invalid_enum_value':
				return 'INVALID_ENUM'
			case 'invalid_literal':
				return 'INVALID_VALUE'
			case 'custom':
				return issue.message || 'CUSTOM_ERROR'
			default:
				continue
			}
		}

		// Se não conseguiu determinar, usa o fallback
		return fallbackCode
	}

	/**
	 * Processa dados de entrada (body, query, params) e injeta diretamente no request
	 */
	private processInput(req: Request, schema: any): void {
		// Processa body se schema de input existir
		if (schema.input) {
			const bodyResult = schema.input.safeParse(req.body)
			if (!bodyResult.success) {
				const errorCode = this.extractErrorCode(bodyResult.error.issues, 'INVALID_BODY')
				throw new ValidationError(errorCode, bodyResult.error.issues)
			}
			// Injeta dados validados diretamente no body
			req.body = bodyResult.data
		}

		// Processa query se schema de query existir
		if (schema.query) {
			const queryResult = schema.query.safeParse(req.query)
			if (!queryResult.success) {
				const errorCode = this.extractErrorCode(queryResult.error.issues, 'INVALID_QUERY')
				throw new ValidationError(errorCode, queryResult.error.issues)
			}
			// Injeta dados validados diretamente no query
			req.query = queryResult.data
		}

		// Processa params se schema de params existir
		if (schema.params) {
			// Extrai parâmetros da URL manualmente se req.params estiver vazio
			let params = req.params
			if (Object.keys(params).length === 0) {
				params = this.extractParamsFromUrl(req.path)
			}

			const paramsResult = schema.params.safeParse(params)
			if (!paramsResult.success) {
				const errorCode = this.extractErrorCode(paramsResult.error.issues, 'INVALID_PARAMS')
				throw new ValidationError(errorCode, paramsResult.error.issues)
			}
			// Injeta dados validados diretamente no params
			req.params = paramsResult.data
		}
	}

	/**
	 * Extrai parâmetros da URL manualmente
	 */
	private extractParamsFromUrl(path: string): any {
		const params: any = {}

		// Para PATCH /v1/ideas/:id, extrai o ID da URL
		if (path.includes('/v1/ideas/') && path !== '/v1/ideas') {
			const pathParts = path.split('/')
			const idIndex = pathParts.findIndex(part => part === 'ideas') + 1
			if (idIndex < pathParts.length) {
				params.id = pathParts[idIndex]
			}
		}

		// Para outras rotas com parâmetros dinâmicos, adicione lógica similar
		// GET /v1/users/:id
		if (path.includes('/v1/users/') && path !== '/v1/users') {
			const pathParts = path.split('/')
			const idIndex = pathParts.findIndex(part => part === 'users') + 1
			if (idIndex < pathParts.length) {
				params.id = pathParts[idIndex]
			}
		}

		// GET /v1/follow/followers/:userId
		if (path.includes('/v1/follow/followers/')) {
			const pathParts = path.split('/')
			const userIdIndex = pathParts.findIndex(part => part === 'followers') + 1
			if (userIdIndex < pathParts.length) {
				params.userId = pathParts[userIdIndex]
			}
		}

		// GET /v1/follow/following/:userId
		if (path.includes('/v1/follow/following/')) {
			const pathParts = path.split('/')
			const userIdIndex = pathParts.findIndex(part => part === 'following') + 1
			if (userIdIndex < pathParts.length) {
				params.userId = pathParts[userIdIndex]
			}
		}

		// DELETE /v1/users/links/:linkId
		if (path.includes('/v1/users/links/')) {
			const pathParts = path.split('/')
			const linkIdIndex = pathParts.findIndex(part => part === 'links') + 1
			if (linkIdIndex < pathParts.length) {
				params.linkId = pathParts[linkIdIndex]
			}
		}

		return params
	}

	/**
	 * Intercepta resposta para serialização automática
	 */
	private interceptResponse(res: Response, schema: any) {
		const originalJson = res.json.bind(res)

		res.json = (body?: any) => {
			try {
				let processedBody = body

				// Aplica serialização automática
				processedBody = this.autoSerialize(processedBody)

				// Valida saída se schema de output existir
				if (schema.output) {
					const outputResult = schema.output.safeParse(processedBody)
					if (!outputResult.success) {
						this.logger.warn('Output validation failed', {
							errors: outputResult.error.issues
						})
						// Continua mesmo com erro de validação de saída
					} else {
						processedBody = outputResult.data
					}
				}

				return originalJson(processedBody)
			} catch (error) {
				this.logger.error('Error serializing response', { error })
				return originalJson(body)
			}
		}
	}

	/**
	 * Serialização automática genérica
	 */
	private autoSerialize(data: any): any {
		if (!data) return data

		if (Array.isArray(data)) {
			return data.map(item => this.autoSerialize(item))
		}

		if (typeof data === 'object' && data.constructor === Object) {
			const serialized: any = {}

			for (const [key, value] of Object.entries(data)) {
				if (value instanceof Date) {
					serialized[key] = value.toISOString()
				} else if (typeof value === 'object' && value !== null) {
					serialized[key] = this.autoSerialize(value)
				} else {
					serialized[key] = value
				}
			}

			return serialized
		}

		return data
	}

	/**
	 * Obtém schema para a rota específica
	 * 🎯 USA EXCLUSIVAMENTE DTOs - schemas hardcoded foram REMOVIDOS COMPLETAMENTE!
	 */
	private getSchemaForRoute(routeKey: string): any {
		// 🎯 PRIORIDADE ABSOLUTA: DTOs registrados automaticamente
		const dtoSchema = this.dtoRegistry.getSchema(routeKey)
		if (dtoSchema) {
			this.logger.info('🎯 USANDO DTO AUTOMATICAMENTE:', routeKey, {
				schemas: Object.keys(dtoSchema).filter(key => dtoSchema[key as keyof typeof dtoSchema])
			})
			return dtoSchema
		}

		// ❌ NÃO HÁ MAIS SCHEMAS HARDCODED!
		// Todos os schemas agora são injetados automaticamente dos DTOs
		this.logger.warn('❌ Nenhum DTO encontrado para rota:', routeKey, {
			message: 'Esta rota precisa ter um DTO padronizado!',
			availableRoutes: this.dtoRegistry.listRoutes()
		})
		return null
	}


	/**
	 * Trata erros de validação
	 */
	private handleValidationError(error: any, req: Request, res: Response) {
		if (error instanceof ValidationError) {
			const statusCode = CommonErrors[error.code as keyof typeof CommonErrors]?.code || 400

			this.logger.warn('Validation failed', {
				path: req.path,
				method: req.method,
				code: error.code,
				issues: error.issues
			})

			res.status(statusCode).json({
				message: error.code,
				details: error.issues.map((issue: any) => ({
					field: issue.path.join('.'),
					message: issue.message,
					code: issue.code
				}))
			})
		} else {
			this.logger.error('Unexpected validation error', {
				error: error instanceof Error ? error.message : 'Unknown error',
				path: req.path,
				method: req.method
			})

			res.status(500).json({
				message: 'INTERNAL_ERROR',
				details: 'An unexpected error occurred during validation'
			})
		}
	}
}

/**
 * Classe de erro para validação
 */
class ValidationError extends Error {
	constructor(
		public code: string,
		public issues: any[]
	) {
		super(`Validation failed: ${code}`)
		this.name = 'ValidationError'
	}
}

/**
 * Configuração do middleware de validação automática
 */
export function setupAutoValidationMiddleware(app: any, logger: Logger) {
	const autoValidationMiddleware = new AutoValidationMiddleware(logger)

	// Aplica middleware globalmente
	app.use(autoValidationMiddleware.process())

	logger.info('AutoValidationMiddleware configured successfully')
}

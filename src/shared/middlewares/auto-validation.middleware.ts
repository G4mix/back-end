import { Request, Response, NextFunction } from 'express'
import { Logger } from '@shared/utils/logger'
import { z } from 'zod'
import { messages } from '@shared/constants/messages'

// Schemas de validação por rota
const ROUTE_SCHEMAS: Record<string, {
	input?: z.ZodSchema
	query?: z.ZodSchema
	params?: z.ZodSchema
	output?: z.ZodSchema
}> = {
	// Auth routes
	'POST /v1/auth/signup': {
		input: z.object({
			username: z.string().regex(/^[^{}]{3,255}$/, 'INVALID_NAME'),
			email: z.string().email('INVALID_EMAIL'),
			password: z.string().regex(/^(?=.*\d)(?=.*[A-Z])(?=.*[$*&@#! ])[^{}]{6,}$/, 'INVALID_PASSWORD')
		})
	},
	'POST /v1/auth/signin': {
		input: z.object({
			email: z.string().email('INVALID_EMAIL'),
			password: z.string().min(1, 'PASSWORD_REQUIRED')
		})
	},
	'POST /v1/auth/change-password': {
		input: z.object({
			password: z.string().regex(/^(?=.*\d)(?=.*[A-Z])(?=.*[$*&@#! ])[^{}]{6,}$/, 'INVALID_PASSWORD')
		})
	},
	'POST /v1/auth/recover-email/send': {
		input: z.object({
			email: z.string().email('INVALID_EMAIL')
		})
	},
	'POST /v1/auth/recover-email/verify': {
		input: z.object({
			email: z.string().email('INVALID_EMAIL'),
			code: z.string().min(1, 'CODE_REQUIRED')
		})
	},
	'POST /v1/auth/refresh-token': {
		input: z.object({
			refreshToken: z.string().min(1, 'REFRESH_TOKEN_REQUIRED')
		})
	},
	'POST /v1/auth/social-login': {
		input: z.object({
			provider: z.enum(['google', 'facebook', 'github']),
			token: z.string().min(1, 'TOKEN_REQUIRED')
		})
	},

	// Ideas routes
	'POST /v1/ideas': {
		input: z.object({
			title: z.string().min(10, 'TITLE_TOO_SHORT').max(70, 'TITLE_TOO_LONG').regex(/^[^{}]+$/, 'INVALID_TITLE'),
			description: z.string().min(50, 'DESCRIPTION_TOO_SHORT').max(700, 'DESCRIPTION_TOO_LONG').regex(/^[^{}]+$/, 'INVALID_DESCRIPTION'),
			tags: z.array(z.string().min(1, 'TAG_EMPTY').max(50, 'TAG_TOO_LONG')).optional(),
			images: z.array(z.any()).optional(), // Express.Multer.File[]
			links: z.array(z.object({
				url: z.string().url('INVALID_LINK_URL').max(700, 'LINK_URL_TOO_LONG')
			})).optional()
		})
	},
	'PATCH /v1/ideas/:id': {
		input: z.object({
			title: z.string().min(10, 'TITLE_TOO_SHORT').max(70, 'TITLE_TOO_LONG').regex(/^[^{}]+$/, 'INVALID_TITLE').optional(),
			description: z.string().min(50, 'DESCRIPTION_TOO_SHORT').max(700, 'DESCRIPTION_TOO_LONG').regex(/^[^{}]+$/, 'INVALID_DESCRIPTION').optional(),
			tags: z.array(z.string().min(1, 'TAG_EMPTY').max(50, 'TAG_TOO_LONG')).optional(),
			images: z.array(z.any()).optional(), // Express.Multer.File[]
			links: z.array(z.object({
				url: z.string().url('INVALID_LINK_URL').max(700, 'LINK_URL_TOO_LONG')
			})).optional()
		}),
		params: z.object({
			id: z.string().uuid('INVALID_IDEA_ID')
		})
	},
	'GET /v1/ideas': {
		query: z.object({
			search: z.string().optional(),
			authorId: z.string().uuid('INVALID_AUTHOR_ID').optional(),
			tags: z.array(z.string()).optional(),
			page: z.coerce.number().int().min(0, 'INVALID_PAGE').optional(),
			limit: z.coerce.number().int().min(1, 'INVALID_LIMIT').max(100, 'LIMIT_TOO_LARGE').optional(),
			sortBy: z.enum(['created_at', 'updated_at', 'title']).optional(),
			sortOrder: z.enum(['asc', 'desc']).optional()
		})
	},
	'GET /v1/ideas/:id': {
		params: z.object({
			id: z.string().uuid('INVALID_IDEA_ID')
		})
	},
	'DELETE /v1/ideas/:id': {
		params: z.object({
			id: z.string().uuid('INVALID_IDEA_ID')
		})
	},

	// Comments routes
	'POST /v1/comments': {
		input: z.object({
			ideaId: z.string().uuid('INVALID_IDEA_ID'),
			content: z.string().min(1, 'CONTENT_REQUIRED').max(200, 'CONTENT_TOO_LONG').regex(/^[^{}]+$/, 'INVALID_CONTENT'),
			parentCommentId: z.string().uuid('INVALID_PARENT_COMMENT_ID').optional()
		})
	},
	'GET /v1/comments': {
		query: z.object({
			ideaId: z.string().uuid('INVALID_IDEA_ID'),
			page: z.coerce.number().int().min(0, 'INVALID_PAGE').optional(),
			limit: z.coerce.number().int().min(1, 'INVALID_LIMIT').max(100, 'LIMIT_TOO_LARGE').optional(),
			parentCommentId: z.string().uuid('INVALID_PARENT_COMMENT_ID').optional()
		})
	},

	// Likes routes
	'POST /v1/likes/toggle': {
		input: z.object({
			ideaId: z.string().uuid('INVALID_IDEA_ID').optional(),
			commentId: z.string().uuid('INVALID_COMMENT_ID').optional()
		}).refine(data => data.ideaId || data.commentId, {
			message: 'IDEA_OR_COMMENT_REQUIRED'
		})
	},

	// Views routes
	'POST /v1/views': {
		input: z.object({
			ideas: z.array(z.string().uuid('INVALID_IDEA_ID'))
				.min(1, 'IDEAS_REQUIRED')
				.max(10, 'TOO_MANY_IDEAS')
		})
	},

	// Follow routes
	'POST /v1/follow/toggle': {
		input: z.object({
			followingId: z.string().uuid('INVALID_USER_ID')
		})
	},
	'GET /v1/follow/followers/:userId': {
		params: z.object({
			userId: z.string().uuid('INVALID_USER_ID')
		}),
		query: z.object({
			page: z.coerce.number().int().min(0, 'INVALID_PAGE').optional(),
			limit: z.coerce.number().int().min(1, 'INVALID_LIMIT').max(100, 'LIMIT_TOO_LARGE').optional()
		})
	},
	'GET /v1/follow/following/:userId': {
		params: z.object({
			userId: z.string().uuid('INVALID_USER_ID')
		}),
		query: z.object({
			page: z.coerce.number().int().min(0, 'INVALID_PAGE').optional(),
			limit: z.coerce.number().int().min(1, 'INVALID_LIMIT').max(100, 'LIMIT_TOO_LARGE').optional()
		})
	},

	// User management routes
	'PUT /v1/users/:id': {
		input: z.object({
			username: z.string().regex(/^[^{}]{3,255}$/, 'INVALID_NAME').optional(),
			email: z.string().email('INVALID_EMAIL').optional(),
			password: z.string().regex(/^(?=.*\d)(?=.*[A-Z])(?=.*[$*&@#! ])[^{}]{6,}$/, 'INVALID_PASSWORD').optional(),
			icon: z.any().optional() // Express.Multer.File
		}),
		params: z.object({
			id: z.string().uuid('INVALID_USER_ID')
		})
	},
	'GET /v1/users': {
		query: z.object({
			page: z.coerce.number().int().min(0, 'INVALID_PAGE').optional(),
			limit: z.coerce.number().int().min(1, 'INVALID_LIMIT').max(100, 'LIMIT_TOO_LARGE').optional(),
			search: z.string().optional()
		})
	},
	'GET /v1/users/:id': {
		params: z.object({
			id: z.string().uuid('INVALID_USER_ID')
		})
	},
	'DELETE /v1/users/:id': {
		params: z.object({
			id: z.string().uuid('INVALID_USER_ID')
		})
	},

	// Personal links routes
	'POST /v1/users/links': {
		input: z.object({
			url: z.string().url('INVALID_URL').max(700, 'URL_TOO_LONG').regex(/^https?:\/\//, 'URL_MUST_START_WITH_HTTP')
		})
	},
	'GET /v1/users/links': {
		query: z.object({
			userId: z.string().uuid('INVALID_USER_ID').optional()
		})
	},
	'DELETE /v1/users/links/:linkId': {
		params: z.object({
			linkId: z.string().uuid('INVALID_LINK_ID')
		})
	}
}

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

	constructor(logger: Logger) {
		this.logger = logger
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
	 */
	private getSchemaForRoute(routeKey: string): any {
		// Tenta encontrar schema exato primeiro
		if (ROUTE_SCHEMAS[routeKey]) {
			console.log('✅ Schema encontrado por match exato:', routeKey)
			return ROUTE_SCHEMAS[routeKey]
		}

		// Tenta encontrar schema por padrão (com parâmetros dinâmicos)
		for (const [key, schema] of Object.entries(ROUTE_SCHEMAS)) {
			const matches = this.matchesRoutePattern(key, routeKey)
			if (matches) {
				return schema
			}
		}

		return null
	}

	/**
	 * Verifica se a rota atual corresponde ao padrão do schema
	 */
	private matchesRoutePattern(pattern: string, route: string): boolean {
		const patternParts = pattern.split(' ')
		const routeParts = route.split(' ')

		if (patternParts.length !== routeParts.length) {
			return false
		}

		for (let i = 0; i < patternParts.length; i++) {
			// Verifica se é um parâmetro dinâmico (começa com /:)
			if (patternParts[i].startsWith('/:') && routeParts[i].startsWith('/')) {
				continue // Parâmetro dinâmico
			}
			// Verifica se é um parâmetro dinâmico sem barra inicial (apenas :id)
			if (patternParts[i].startsWith(':') && !patternParts[i].startsWith('/:')) {
				continue // Parâmetro dinâmico
			}
			
			// Compara caminhos dividindo por /
			if (patternParts[i].includes('/') && routeParts[i].includes('/')) {
				const patternPathParts = patternParts[i].split('/')
				const routePathParts = routeParts[i].split('/')
				
				if (patternPathParts.length !== routePathParts.length) {
					return false
				}
				
				let pathMatches = true
				for (let j = 0; j < patternPathParts.length; j++) {
					if (patternPathParts[j].startsWith(':')) {
						continue // Parâmetro dinâmico no caminho
					}
					if (patternPathParts[j] !== routePathParts[j]) {
						pathMatches = false
						break
					}
				}
				
				if (!pathMatches) {
					return false
				}
				continue
			}
			
			if (patternParts[i] !== routeParts[i]) {
				return false
			}
		}

		return true
	}

	/**
	 * Trata erros de validação
	 */
	private handleValidationError(error: any, req: Request, res: Response) {
		if (error instanceof ValidationError) {
			const statusCode = messages[error.code as keyof typeof messages] || 400
			
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

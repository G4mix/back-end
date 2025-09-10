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
	'POST /api/v1/auth/signup': {
		input: z.object({
			username: z.string().regex(/^[^{}]{3,255}$/, 'INVALID_NAME'),
			email: z.string().email('INVALID_EMAIL'),
			password: z.string().regex(/^(?=.*\d)(?=.*[A-Z])(?=.*[$*&@#! ])[^{}]{6,}$/, 'INVALID_PASSWORD')
		})
	},
	'POST /api/v1/auth/signin': {
		input: z.object({
			email: z.string().email('INVALID_EMAIL'),
			password: z.string().min(1, 'PASSWORD_REQUIRED')
		})
	},
	'POST /api/v1/auth/change-password': {
		input: z.object({
			password: z.string().regex(/^(?=.*\d)(?=.*[A-Z])(?=.*[$*&@#! ])[^{}]{6,}$/, 'INVALID_PASSWORD')
		})
	},
	'POST /api/v1/auth/recover-email/send': {
		input: z.object({
			email: z.string().email('INVALID_EMAIL')
		})
	},
	'POST /api/v1/auth/recover-email/verify': {
		input: z.object({
			email: z.string().email('INVALID_EMAIL'),
			code: z.string().min(1, 'CODE_REQUIRED')
		})
	},
	'POST /api/v1/auth/refresh-token': {
		input: z.object({
			refreshToken: z.string().min(1, 'REFRESH_TOKEN_REQUIRED')
		})
	},
	'POST /api/v1/auth/social-login': {
		input: z.object({
			provider: z.enum(['google', 'facebook', 'github']),
			token: z.string().min(1, 'TOKEN_REQUIRED')
		})
	},

	// Ideas routes
	'POST /api/v1/ideas': {
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
	'PUT /api/v1/ideas/:id': {
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
	'GET /api/v1/ideas': {
		query: z.object({
			search: z.string().optional(),
			authorId: z.string().uuid('INVALID_AUTHOR_ID').optional(),
			tags: z.string().optional(),
			page: z.coerce.number().int().min(0, 'INVALID_PAGE').optional(),
			limit: z.coerce.number().int().min(1, 'INVALID_LIMIT').max(100, 'LIMIT_TOO_LARGE').optional(),
			sortBy: z.enum(['created_at', 'updated_at', 'title']).optional(),
			sortOrder: z.enum(['asc', 'desc']).optional()
		})
	},
	'GET /api/v1/ideas/:id': {
		params: z.object({
			id: z.string().uuid('INVALID_IDEA_ID')
		})
	},
	'DELETE /api/v1/ideas/:id': {
		params: z.object({
			id: z.string().uuid('INVALID_IDEA_ID')
		})
	},

	// Comments routes
	'POST /api/v1/comments': {
		input: z.object({
			ideaId: z.string().uuid('INVALID_IDEA_ID'),
			content: z.string().min(1, 'CONTENT_REQUIRED').max(200, 'CONTENT_TOO_LONG').regex(/^[^{}]+$/, 'INVALID_CONTENT'),
			parentCommentId: z.string().uuid('INVALID_PARENT_COMMENT_ID').optional()
		})
	},
	'GET /api/v1/comments': {
		query: z.object({
			ideaId: z.string().uuid('INVALID_IDEA_ID'),
			page: z.coerce.number().int().min(0, 'INVALID_PAGE').optional(),
			limit: z.coerce.number().int().min(1, 'INVALID_LIMIT').max(100, 'LIMIT_TOO_LARGE').optional(),
			parentCommentId: z.string().uuid('INVALID_PARENT_COMMENT_ID').optional()
		})
	},

	// Likes routes
	'POST /api/v1/likes/toggle': {
		input: z.object({
			ideaId: z.string().uuid('INVALID_IDEA_ID').optional(),
			commentId: z.string().uuid('INVALID_COMMENT_ID').optional()
		}).refine(data => data.ideaId || data.commentId, {
			message: 'IDEA_OR_COMMENT_REQUIRED'
		})
	},

	// Views routes
	'POST /api/v1/views': {
		input: z.object({
			ideas: z.array(z.string().uuid('INVALID_IDEA_ID'))
				.min(1, 'IDEAS_REQUIRED')
				.max(10, 'TOO_MANY_IDEAS')
		})
	},

	// Follow routes
	'POST /api/v1/follow/toggle': {
		input: z.object({
			followingId: z.string().uuid('INVALID_USER_ID')
		})
	},
	'GET /api/v1/follow/followers/:userId': {
		params: z.object({
			userId: z.string().uuid('INVALID_USER_ID')
		}),
		query: z.object({
			page: z.coerce.number().int().min(0, 'INVALID_PAGE').optional(),
			limit: z.coerce.number().int().min(1, 'INVALID_LIMIT').max(100, 'LIMIT_TOO_LARGE').optional()
		})
	},
	'GET /api/v1/follow/following/:userId': {
		params: z.object({
			userId: z.string().uuid('INVALID_USER_ID')
		}),
		query: z.object({
			page: z.coerce.number().int().min(0, 'INVALID_PAGE').optional(),
			limit: z.coerce.number().int().min(1, 'INVALID_LIMIT').max(100, 'LIMIT_TOO_LARGE').optional()
		})
	},

	// User management routes
	'PUT /api/v1/users/:id': {
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
	'GET /api/v1/users': {
		query: z.object({
			page: z.coerce.number().int().min(0, 'INVALID_PAGE').optional(),
			limit: z.coerce.number().int().min(1, 'INVALID_LIMIT').max(100, 'LIMIT_TOO_LARGE').optional(),
			search: z.string().optional()
		})
	},
	'GET /api/v1/users/:id': {
		params: z.object({
			id: z.string().uuid('INVALID_USER_ID')
		})
	},
	'DELETE /api/v1/users/:id': {
		params: z.object({
			id: z.string().uuid('INVALID_USER_ID')
		})
	},

	// Personal links routes
	'POST /api/v1/users/links': {
		input: z.object({
			url: z.string().url('INVALID_URL').max(700, 'URL_TOO_LONG').regex(/^https?:\/\//, 'URL_MUST_START_WITH_HTTP')
		})
	},
	'GET /api/v1/users/links': {
		query: z.object({
			userId: z.string().uuid('INVALID_USER_ID').optional()
		})
	},
	'DELETE /api/v1/users/links/:linkId': {
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
				const schema = this.getSchemaForRoute(routeKey, req.path)

				if (!schema) {
					return next()
				}

				// Processa entrada (body, query, params)
				const inputData = this.processInput(req, schema)
				
				// Injeta dados processados no request
				req.validatedData = inputData

				// Intercepta resposta para serialização
				this.interceptResponse(res, schema)

				next()
			} catch (error) {
				this.handleValidationError(error, req, res)
			}
		}
	}

	/**
	 * Processa dados de entrada (body, query, params)
	 */
	private processInput(req: Request, schema: any): any {
		const inputData: any = {}

		// Processa body se schema de input existir
		if (schema.input) {
			const bodyResult = schema.input.safeParse(req.body)
			if (!bodyResult.success) {
				throw new ValidationError('INVALID_BODY', bodyResult.error.issues)
			}
			inputData.body = bodyResult.data
		}

		// Processa query se schema de query existir
		if (schema.query) {
			const queryResult = schema.query.safeParse(req.query)
			if (!queryResult.success) {
				throw new ValidationError('INVALID_QUERY', queryResult.error.issues)
			}
			inputData.query = queryResult.data
		}

		// Processa params se schema de params existir
		if (schema.params) {
			const paramsResult = schema.params.safeParse(req.params)
			if (!paramsResult.success) {
				throw new ValidationError('INVALID_PARAMS', paramsResult.error.issues)
			}
			inputData.params = paramsResult.data
		}

		return inputData
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
	private getSchemaForRoute(routeKey: string, _path: string): any {
		// Tenta encontrar schema exato primeiro
		if (ROUTE_SCHEMAS[routeKey]) {
			return ROUTE_SCHEMAS[routeKey]
		}

		// Tenta encontrar schema por padrão (com parâmetros dinâmicos)
		for (const [key, schema] of Object.entries(ROUTE_SCHEMAS)) {
			if (this.matchesRoutePattern(key, routeKey)) {
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

		if (patternParts.length !== routeParts.length) return false

		for (let i = 0; i < patternParts.length; i++) {
			if (patternParts[i].startsWith('/:') && routeParts[i].startsWith('/')) {
				continue // Parâmetro dinâmico
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

// Extensão da interface Request para incluir dados validados
declare global {
	namespace Express {
		interface Request {
			validatedData?: {
				body?: any
				query?: any
				params?: any
			}
		}
	}
}

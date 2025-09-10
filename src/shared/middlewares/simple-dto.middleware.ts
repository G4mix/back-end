import { Request, Response, NextFunction } from 'express'
import { Logger } from '@shared/utils/logger'

// Estender o tipo Request para incluir os métodos utilitários
declare global {
	namespace Express {
		interface Request {
			getInputDTO?: () => any
			getQueryDTO?: () => any
			getParamsDTO?: () => any
		}
	}
}

/**
 * Middleware simples para validação e serialização de DTOs
 * Funciona sem decorators complexos
 */

export class SimpleDTOMiddleware {
	private logger: Logger

	constructor(logger: Logger) {
		this.logger = logger
	}

	/**
	 * Middleware para processar entrada (body, query, params)
	 */
	processInput() {
		return (req: Request, res: Response, next: NextFunction) => {
			try {
				// Adiciona métodos utilitários ao request
				req.getInputDTO = () => req.body
				req.getQueryDTO = () => req.query
				req.getParamsDTO = () => req.params
				
				next()
			} catch (error) {
				this.logger.error('Error in processInput middleware', { error })
				res.status(500).json({ error: 'INTERNAL_ERROR' })
			}
		}
	}

	/**
	 * Middleware para processar saída (response)
	 */
	processOutput() {
		return (_req: Request, res: Response, next: NextFunction) => {
			// Intercepta a resposta para serialização
			const originalJson = res.json
			
			res.json = function(body: any) {
				// Aqui você pode adicionar lógica de serialização se necessário
				return originalJson.call(this, body)
			}
			
			next()
		}
	}

	/**
	 * Middleware principal
	 */
	process() {
		return (req: Request, _res: Response, next: NextFunction) => {
			// Adiciona métodos utilitários ao request
			req.getInputDTO = () => req.body
			req.getQueryDTO = () => req.query
			req.getParamsDTO = () => req.params
			
			next()
		}
	}
}

/**
 * Configuração simples do middleware
 */
export function setupSimpleDTOMiddleware(app: any, logger: Logger) {
	const simpleDTOMiddleware = new SimpleDTOMiddleware(logger)

	// Middleware principal (deve ser aplicado antes das rotas)
	app.use(simpleDTOMiddleware.process())

	// Middleware para processar entrada (body, query, params)
	app.use(simpleDTOMiddleware.processInput())

	// Middleware para processar saída (response)
	app.use(simpleDTOMiddleware.processOutput())

	logger.info('SimpleDTOMiddleware configured successfully')
}

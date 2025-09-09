import { Request, Response, NextFunction } from 'express'
import { Logger } from '@shared/utils/logger'

/**
 * Middleware inteligente para injeção automática de DTOs
 * 
 * Funcionalidades:
 * - Validação automática de entrada usando DTOs
 * - Injeção de dados processados no request
 * - Serialização automática da resposta
 * - Tratamento de erros centralizado
 */
export class SmartDTOMiddleware {
	private logger: Logger

	constructor(logger: Logger) {
		this.logger = logger
	}

	/**
	 * Middleware principal que processa DTOs automaticamente
	 */
	process() {
		return (req: Request, res: Response, next: NextFunction) => {
			// Adiciona métodos utilitários ao request
			this.addRequestHelpers(req, res)
			next()
		}
	}

	/**
	 * Middleware para processar entrada (body, query, params)
	 */
	processInput() {
		return (req: Request, res: Response, next: NextFunction) => {
			try {
				const controller = this.getControllerFromRequest(req)
				const methodName = this.getMethodNameFromRequest(req)
				
				if (!controller || !methodName) {
					return next()
				}

				const inputDTOClass = Reflect.getMetadata('inputDTO', controller, methodName)
				const validationSchema = Reflect.getMetadata('inputValidationSchema', controller, methodName)
				const inputTransformer = Reflect.getMetadata('inputTransformer', controller, methodName)
				
				if (!inputDTOClass) {
					return next()
				}

				// Extrai dados de entrada
				let inputData = this.extractInputData(req)

				// Aplica transformação se configurada
				if (inputTransformer) {
					inputData = inputTransformer(inputData)
				}

				// Valida com schema Zod se configurado
				if (validationSchema) {
					try {
						inputData = validationSchema.parse(inputData)
					} catch (error) {
						if (error instanceof Error && 'errors' in error) {
							this.logger.warn('Zod validation failed', {
								path: req.path,
								method: req.method,
								errors: (error as any).errors
							})
							
							res.status(400).json({
								error: 'VALIDATION_ERROR',
								message: 'Dados de entrada inválidos',
								details: (error as any).errors.map((err: any) => ({
									field: err.path.join('.'),
									message: err.message,
									code: err.code
								}))
							})
							return
						}
						throw error
					}
				}

				// Processa DTO
				const inputDTO = new inputDTOClass(inputData)

				// Valida dados do DTO se tiver método isValid
				if (inputDTO.isValid && !inputDTO.isValid()) {
					this.logger.warn('DTO validation failed', {
						path: req.path,
						method: req.method,
						errors: inputDTO.getValidationErrors?.() || 'Unknown validation error'
					})
					
					res.status(400).json({
						message: 'VALIDATION_ERROR',
						details: inputDTO.getValidationErrors?.() || 'Invalid input data'
					})
					return
				}

				// Injeta dados processados no request
				req.dto = {
					input: inputDTO,
					...req.dto
				}

				this.logger.debug('Input processed successfully', {
					path: req.path,
					method: req.method,
					validatedFields: Object.keys(inputDTO.toJSON())
				})

				next()
			} catch (error) {
				this.logger.error('Error processing input DTO', {
					error: error instanceof Error ? error.message : 'Unknown error',
					path: req.path,
					method: req.method
				})
				
				res.status(500).json({
					message: 'INTERNAL_ERROR',
					details: 'Failed to process input data'
				})
			}
		}
	}

	/**
	 * Middleware para processar saída (response)
	 */
	processOutput() {
		return (req: Request, res: Response, next: NextFunction) => {
			// Intercepta o método json original
			const originalJson = res.json.bind(res)
			
			res.json = (body?: any) => {
				try {
					const controller = this.getControllerFromRequest(req)
					const methodName = this.getMethodNameFromRequest(req)
					
					if (!controller || !methodName) {
						return originalJson(body)
					}

					const outputDTOClass = Reflect.getMetadata('outputDTO', controller, methodName)
					const autoSerialize = Reflect.getMetadata('autoSerialize', controller, methodName)
					const responseTransformer = Reflect.getMetadata('responseTransformer', controller, methodName)

					let processedBody = body

					// Aplica transformação customizada se definida
					if (responseTransformer) {
						processedBody = responseTransformer(body)
					}

					// Processa com DTO de saída se definido
					if (outputDTOClass) {
						const outputDTO = new outputDTOClass(processedBody)
						processedBody = outputDTO.toJSON()
					}
					// Ou aplica serialização automática se habilitada
					else if (autoSerialize && processedBody) {
						processedBody = this.autoSerialize(processedBody)
					}

					this.logger.debug('Output processed successfully', {
						path: req.path,
						method: req.method,
						hasOutputDTO: !!outputDTOClass,
						autoSerialize
					})

					return originalJson(processedBody)
				} catch (error) {
					this.logger.error('Error processing output DTO', {
						error: error instanceof Error ? error.message : 'Unknown error',
						path: req.path,
						method: req.method
					})
					
					// Em caso de erro, retorna o body original
					return originalJson(body)
				}
			}

			next()
		}
	}

	/**
	 * Middleware para tratamento de erros
	 */
	handleErrors() {
		return (error: Error, req: Request, res: Response, _next: NextFunction) => {
			const controller = this.getControllerFromRequest(req)
			const methodName = this.getMethodNameFromRequest(req)
			
			if (controller && methodName) {
				const errorHandler = Reflect.getMetadata('errorHandler', controller, methodName)
				if (errorHandler) {
					return errorHandler(error, req, res)
				}
			}

			this.logger.error('Unhandled error in DTO middleware', {
				error: error.message,
				stack: error.stack,
				path: req.path,
				method: req.method
			})

			res.status(500).json({
				message: 'INTERNAL_ERROR',
				details: 'An unexpected error occurred'
			})
		}
	}

	/**
	 * Adiciona métodos utilitários ao request
	 */
	private addRequestHelpers(req: Request, _res: Response) {
		// Adiciona propriedade dto ao request
		req.dto = req.dto || {}

		// Método para acessar dados de entrada processados
		req.getInputDTO = <T = any>(): T => {
			return req.dto?.input as T
		}

		// Método para validar dados customizados
		req.validateWith = (validator: (data: any) => boolean | string) => {
			const data = req.getInputDTO?.() || {}
			const result = validator(data)
			if (result !== true) {
				throw new Error(typeof result === 'string' ? result : 'Validation failed')
			}
		}

		// Método para serializar resposta automaticamente
		req.serializeResponse = (data: any) => {
			return this.autoSerialize(data)
		}
	}

	/**
	 * Extrai dados de entrada do request (body, query, params)
	 */
	private extractInputData(req: Request): any {
		return {
			...req.body,
			...req.query,
			...req.params
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
	 * Obtém a instância do controller do request
	 */
	private getControllerFromRequest(req: Request): any {
		return (req as any).controller
	}

	/**
	 * Obtém o nome do método do request
	 */
	private getMethodNameFromRequest(req: Request): string {
		return (req as any).methodName
	}
}

// Extensão da interface Request para incluir propriedades do DTO
declare global {
	namespace Express {
		interface Request {
			dto?: {
				input?: any
				output?: any
			}
			getInputDTO?: <T = any>() => T
			validateWith?: (validator: (data: any) => boolean | string) => void
			serializeResponse?: (data: any) => any
			controller?: any
			methodName?: string
		}
	}
}

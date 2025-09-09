import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'

/**
 * Middleware de validação inteligente que funciona com DTOs
 * Valida os dados após o processamento do DTO, garantindo que os dados estejam formatados corretamente
 */

export function dtoValidation(schema: z.ZodSchema) {
	return (req: Request, res: Response, next: NextFunction) => {
		try {
			// Se o DTO já foi processado, valida os dados processados
			if (req.dto?.input) {
				const validatedData = schema.parse(req.dto.input)
				req.dto.input = validatedData
				return next()
			}

			// Se o DTO não foi processado ainda, valida os dados brutos
			// e processa o DTO automaticamente
			const validatedData = schema.parse(req.body)
			
			// Processa o DTO com os dados validados
			req.dto = req.dto || {}
			req.dto.input = validatedData

			next()
		} catch (error) {
			if (error instanceof z.ZodError) {
				return res.status(400).json({
					error: 'VALIDATION_ERROR',
					message: 'Dados de entrada inválidos',
					details: error.errors.map(err => ({
						field: err.path.join('.'),
						message: err.message,
						code: err.code
					}))
				})
			}

			return res.status(500).json({
				error: 'INTERNAL_ERROR',
				message: 'Erro interno do servidor'
			})
		}
	}
}

/**
 * Middleware de validação que funciona especificamente com DTOs de entrada
 * Este middleware deve ser usado APÓS o middleware do DTO
 */
export function validateInputDTO<T>(validator: (data: any) => data is T) {
	return (req: Request, res: Response, next: NextFunction) => {
		try {
			const inputData = req.dto?.input
			
			if (!inputData) {
				return res.status(400).json({
					error: 'VALIDATION_ERROR',
					message: 'Dados de entrada não processados'
				})
			}

			if (!validator(inputData)) {
				return res.status(400).json({
					error: 'VALIDATION_ERROR',
					message: 'Dados de entrada inválidos'
				})
			}

			return next()
		} catch (error) {
			return res.status(500).json({
				error: 'INTERNAL_ERROR',
				message: 'Erro interno do servidor'
			})
		}
	}
}

/**
 * Middleware de validação que funciona com DTOs de saída
 * Valida os dados antes de enviar a resposta
 */
export function validateOutputDTO<T>(validator: (data: any) => data is T) {
	return (_req: Request, res: Response, next: NextFunction) => {
		try {
			const originalJson = res.json
			
			res.json = function(data: any) {
				if (!validator(data)) {
					return res.status(500).json({
						error: 'SERIALIZATION_ERROR',
						message: 'Erro na serialização dos dados de saída'
					})
				}
				
				return originalJson.call(this, data)
			}

			return next()
		} catch (error) {
			return res.status(500).json({
				error: 'INTERNAL_ERROR',
				message: 'Erro interno do servidor'
			})
		}
	}
}

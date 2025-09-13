import { z } from 'zod'
import { CommonErrors, ErrorResponse } from './error-response'

/**
 * Utilitário para validação de campos de formulário
 * 
 * Funcionalidades:
 * - Validação de campos @FormField usando schemas Zod
 * - Retorno padronizado de erros de validação no formato CommonErrors
 * - Compatível com TSOA e multipart/form-data
 */
export class FormValidationUtil {
	/**
	 * Valida campos de formulário usando um schema Zod
	 * 
	 * @param fields - Objeto com os campos a serem validados
	 * @param schema - Schema Zod para validação
	 * @returns Resultado da validação com sucesso/erro no formato CommonErrors
	 */
	static validateFields<T>(fields: any, schema: z.ZodSchema<T>): { 
		success: boolean; 
		error?: ErrorResponse 
	} {
		try {
			// Processa campos especiais antes da validação
			const processedFields = this.preprocessFields(fields)
			
			const result = schema.safeParse(processedFields)
			if (!result.success) {
				// Extrai o primeiro erro para retornar
				const firstError = result.error.issues[0]
				
				// Mapeia erros Zod para CommonErrors
				const errorCode = this.mapZodErrorToCommonError(firstError)
				return {
					success: false,
					error: CommonErrors[errorCode] || CommonErrors.VALIDATION_ERROR
				}
			}
			return { success: true }
		} catch (error) {
			return {
				success: false,
				error: CommonErrors.VALIDATION_ERROR
			}
		}
	}

	/**
	 * Pré-processa campos especiais antes da validação Zod
	 */
	private static preprocessFields(fields: any): any {
		const processed = { ...fields }
		
		// Processa links: converte string JSON para array
		if (processed.links && typeof processed.links === 'string') {
			try {
				processed.links = JSON.parse(processed.links)
			} catch {
				// Se não conseguir fazer parse, tenta split por vírgula
				processed.links = processed.links.split(',').map((link: string) => link.trim())
			}
		}
		
		return processed
	}

	/**
	 * Mapeia erros Zod para códigos de erro do CommonErrors
	 */
	private static mapZodErrorToCommonError(zodError: any): string {
		const { code, message, path } = zodError
		
		// Mapeia erros específicos por campo
		if (path && path.length > 0) {
			const field = path[0]
			
			// Erros de tamanho
			if (code === 'too_big') {
				if (field === 'displayName') return 'NAME_TOO_LONG' // Usa NAME_TOO_LONG para displayName muito longo
				if (field === 'autobiography') return 'BIO_TOO_LONG' // Usa BIO_TOO_LONG para bio muito longa
			}
			
			// Erros de formato
			if (code === 'invalid_string' && message.includes('email')) return 'INVALID_EMAIL'
			if (code === 'invalid_string' && message.includes('url')) return 'INVALID_URL'
		}
		
		// Fallback para erros genéricos
		return 'VALIDATION_ERROR'
	}
}

import { ApiMessage } from '@shared/constants/messages'

/**
 * Utilitário para padronizar retornos de erro
 * Garante que todos os erros sigam o formato: { message: 'ERROR_CODE' }
 */

export interface ErrorResponse {
	message: string
}

/**
 * Cria uma resposta de erro padronizada
 * @param errorCode - Código do erro (ex: 'USER_NOT_FOUND', 'UNAUTHORIZED')
 * @returns Objeto com formato padronizado { message: errorCode }
 */
export function createErrorResponse(errorCode: ApiMessage | string): ErrorResponse {
	return { message: errorCode }
}

/**
 * Tipos de erro comuns para facilitar o uso
 * Reutiliza as constantes já definidas em @shared/constants/messages
 * Cada erro já retorna automaticamente no formato { message: 'ERROR_CODE' }
 */
export const CommonErrors = {
	get UNAUTHORIZED() { return { message: 'UNAUTHORIZED' } },
	get USER_NOT_FOUND() { return { message: 'USER_NOT_FOUND' } },
	get IDEA_NOT_FOUND() { return { message: 'NOT_FOUNDED_DATA' } }, // Usando a constante existente
	get COMMENT_NOT_FOUND() { return { message: 'NOT_FOUNDED_DATA' } }, // Usando a constante existente
	get FORBIDDEN() { return { message: 'YOU_ARE_NOT_THE_AUTHOR' } }, // Usando a constante existente
	get DATABASE_ERROR() { return { message: 'ERROR_WHILE_CHECKING_EMAIL' } }, // Usando uma constante de erro genérica
	get VALIDATION_ERROR() { return { message: 'INVALID_CONTENT' } }, // Usando a constante existente
	get INTERNAL_ERROR() { return { message: 'ERROR_WHILE_SENDING_EMAIL' } }, // Usando uma constante de erro genérica
	get USER_ALREADY_EXISTS() { return { message: 'USER_ALREADY_EXISTS' } },
	get EXCESSIVE_LOGIN_ATTEMPTS() { return { message: 'EXCESSIVE_LOGIN_ATTEMPTS' } },
	get INVALID_PASSWORD() { return { message: 'INVALID_PASSWORD' } },
	get INVALID_EMAIL() { return { message: 'INVALID_EMAIL' } },
	get EMAIL_NOT_VERIFIED() { return { message: 'EMAIL_NOT_VERIFIED' } },
	get TOKEN_NOT_FOUND() { return { message: 'TOKEN_NOT_FOUND' } }
} as const

export type CommonErrorType = typeof CommonErrors[keyof typeof CommonErrors]

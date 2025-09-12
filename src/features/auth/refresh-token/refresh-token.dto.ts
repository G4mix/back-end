import { z } from 'zod'

/**
 * Schema de entrada para refresh token
 * Segue o padrão do middleware de validação automática
 */
export const RefreshTokenInputSchema = z.object({
	refreshToken: z.string()
		.min(1, 'REFRESH_TOKEN_REQUIRED')
})

/**
 * Schema de saída para refresh token
 */
export const RefreshTokenOutputSchema = z.object({
	accessToken: z.string(),
	refreshToken: z.string()
})

/**
 * DTO padronizado para refresh token
 * Compatível com o sistema de registro automático
 */
export const RefreshTokenDTO = {
	InputSchema: RefreshTokenInputSchema,
	OutputSchema: RefreshTokenOutputSchema
}

export type RefreshTokenInput = z.infer<typeof RefreshTokenInputSchema>
export type RefreshTokenOutput = z.infer<typeof RefreshTokenOutputSchema>

export const RefreshTokenErrorMessages = {
	UNAUTHORIZED: 'Invalid or expired token',
	USER_NOT_FOUND: 'User not found',
	TOKEN_REFRESH_FAILED: 'Failed to refresh token',
	INVALID_TOKEN_FORMAT: 'Invalid token format'
} as const

export type RefreshTokenError = keyof typeof RefreshTokenErrorMessages

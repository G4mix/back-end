import { z } from 'zod'

export const RefreshTokenInputSchema = z.object({
	token: z.string()
		.min(1, 'Token is required')
})

export const RefreshTokenOutputSchema = z.object({
	accessToken: z.string(),
	refreshToken: z.string()
})

export type RefreshTokenInput = z.infer<typeof RefreshTokenInputSchema>
export type RefreshTokenOutput = z.infer<typeof RefreshTokenOutputSchema>

export const RefreshTokenErrorMessages = {
	UNAUTHORIZED: 'Invalid or expired token',
	USER_NOT_FOUND: 'User not found',
	TOKEN_REFRESH_FAILED: 'Failed to refresh token',
	INVALID_TOKEN_FORMAT: 'Invalid token format'
} as const

export type RefreshTokenError = keyof typeof RefreshTokenErrorMessages

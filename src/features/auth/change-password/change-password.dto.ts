import { z } from 'zod'

/**
 * Schema de entrada para mudança de senha
 * Segue o padrão do middleware de validação automática
 */
export const ChangePasswordInputSchema = z.object({
	newPassword: z.string()
		.regex(/^(?=.*\d)(?=.*[A-Z])(?=.*[$*&@#! ])[^{}]{6,}$/, 'INVALID_PASSWORD')
})

/**
 * Schema de saída para mudança de senha
 */
export const ChangePasswordOutputSchema = z.object({
	accessToken: z.string(),
	refreshToken: z.string(),
	user: z.object({
		id: z.string(),
		username: z.string(),
		email: z.string(),
		verified: z.boolean(),
		created_at: z.date(),
		updated_at: z.date(),
		userProfileId: z.string(),
		loginAttempts: z.number(),
		blockedUntil: z.date().nullable(),
		userProfile: z.object({
			id: z.string(),
			name: z.string().nullable(),
			bio: z.string().nullable(),
			icon: z.string().nullable(),
			created_at: z.date(),
			updated_at: z.date()
		})
	})
})

/**
 * DTO padronizado para mudança de senha
 * Compatível com o sistema de registro automático
 */
export const ChangePasswordDTO = {
	InputSchema: ChangePasswordInputSchema,
	OutputSchema: ChangePasswordOutputSchema
}

export type ChangePasswordInput = z.infer<typeof ChangePasswordInputSchema>
export type ChangePasswordOutput = z.infer<typeof ChangePasswordOutputSchema>

export const ChangePasswordErrorMessages = {
	USER_NOT_FOUND: 'User not found',
	INVALID_PASSWORD: 'Invalid password format',
	PASSWORD_CHANGE_FAILED: 'Failed to change password'
} as const

export type ChangePasswordError = keyof typeof ChangePasswordErrorMessages

import { z } from 'zod'

/**
 * Schema de entrada para cadastro
 * Segue o padrão do middleware de validação automática
 */
export const SignupInputSchema = z.object({
	email: z.string()
		.email('INVALID_EMAIL')
		.min(1, 'EMAIL_REQUIRED'),
	password: z.string()
		.regex(/^(?=.*\d)(?=.*[A-Z])(?=.*[$*&@#! ])[^{}]{6,}$/, 'INVALID_PASSWORD'),
	username: z.string()
		.regex(/^[^{}]{3,255}$/, 'INVALID_NAME')
})

export const SignupOutputSchema = z.object({
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
 * DTO padronizado para cadastro
 * Compatível com o sistema de registro automático
 */
export const SignupDTO = {
	InputSchema: SignupInputSchema,
	OutputSchema: SignupOutputSchema
}

export type SignupInput = z.infer<typeof SignupInputSchema>
export type SignupOutput = z.infer<typeof SignupOutputSchema>

export const SignupErrorMessages = {
	USER_ALREADY_EXISTS: 'User already exists',
	EMAIL_VERIFICATION_FAILED: 'Email verification failed',
	USER_CREATION_FAILED: 'Failed to create user',
	INVALID_EMAIL_FORMAT: 'Invalid email format',
	INVALID_PASSWORD_FORMAT: 'Invalid password format',
	INVALID_USERNAME_FORMAT: 'Invalid username format'
} as const

export type SignupError = keyof typeof SignupErrorMessages

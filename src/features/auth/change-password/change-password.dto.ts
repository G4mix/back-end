import { z } from 'zod'

export const ChangePasswordInputSchema = z.object({
	password: z.string()
		.min(8, 'Password must be at least 8 characters long')
		.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
			'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character')
})

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

export type ChangePasswordInput = z.infer<typeof ChangePasswordInputSchema>
export type ChangePasswordOutput = z.infer<typeof ChangePasswordOutputSchema>

export const ChangePasswordErrorMessages = {
	USER_NOT_FOUND: 'User not found',
	INVALID_PASSWORD: 'Invalid password format',
	PASSWORD_CHANGE_FAILED: 'Failed to change password'
} as const

export type ChangePasswordError = keyof typeof ChangePasswordErrorMessages

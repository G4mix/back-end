import { z } from 'zod'

export const SignupInputSchema = z.object({
	email: z.string()
		.email('Invalid email format')
		.min(1, 'Email is required'),
	password: z.string()
		.min(8, 'Password must be at least 8 characters long')
		.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
			'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
	username: z.string()
		.min(3, 'Username must be at least 3 characters long')
		.max(20, 'Username must be at most 20 characters long')
		.regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores')
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

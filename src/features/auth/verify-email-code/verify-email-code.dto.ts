import { z } from 'zod'

export const VerifyEmailCodeInputSchema = z.object({
	code: z.string()
		.length(6, 'Code must be exactly 6 characters')
		.regex(/^[A-Z0-9]+$/, 'Code must contain only uppercase letters and numbers'),
	email: z.string()
		.email('Invalid email format')
		.min(1, 'Email is required')
})

export const VerifyEmailCodeOutputSchema = z.object({
	accessToken: z.string()
})

export type VerifyEmailCodeInput = z.infer<typeof VerifyEmailCodeInputSchema>
export type VerifyEmailCodeOutput = z.infer<typeof VerifyEmailCodeOutputSchema>

export const VerifyEmailCodeErrorMessages = {
	USER_NOT_FOUND: 'User not found',
	CODE_EXPIRED: 'Recovery code has expired',
	CODE_NOT_EQUALS: 'Invalid recovery code',
	INVALID_EMAIL_FORMAT: 'Invalid email format',
	INVALID_CODE_FORMAT: 'Invalid code format'
} as const

export type VerifyEmailCodeError = keyof typeof VerifyEmailCodeErrorMessages

import { z } from 'zod'

export const SendRecoverEmailInputSchema = z.object({
	email: z.string()
		.email('Invalid email format')
		.min(1, 'Email is required')
})

export const SendRecoverEmailOutputSchema = z.object({
	email: z.string().email()
})

export type SendRecoverEmailInput = z.infer<typeof SendRecoverEmailInputSchema>
export type SendRecoverEmailOutput = z.infer<typeof SendRecoverEmailOutputSchema>

export const SendRecoverEmailErrorMessages = {
	USER_NOT_FOUND: 'User not found',
	EMAIL_SEND_FAILED: 'Failed to send recovery email',
	INVALID_EMAIL_FORMAT: 'Invalid email format'
} as const

export type SendRecoverEmailError = keyof typeof SendRecoverEmailErrorMessages

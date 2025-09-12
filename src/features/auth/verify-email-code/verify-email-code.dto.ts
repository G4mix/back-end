import { z } from 'zod'

/**
 * Schema de entrada para verificação de código de email
 * Segue o padrão do middleware de validação automática
 */
export const VerifyEmailCodeInputSchema = z.object({
	email: z.string()
		.email('INVALID_EMAIL')
		.min(1, 'EMAIL_REQUIRED'),
	code: z.string()
		.min(1, 'CODE_REQUIRED')
})

/**
 * Schema de saída para verificação de código de email
 */
export const VerifyEmailCodeOutputSchema = z.object({
	accessToken: z.string()
})

/**
 * DTO padronizado para verificação de código de email
 * Compatível com o sistema de registro automático
 */
export const VerifyEmailCodeDTO = {
	InputSchema: VerifyEmailCodeInputSchema,
	OutputSchema: VerifyEmailCodeOutputSchema
}

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

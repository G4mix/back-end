import { z } from 'zod'

/**
 * Schema de entrada para envio de email de recuperação
 * Segue o padrão do middleware de validação automática
 */
export const SendRecoverEmailInputSchema = z.object({
	email: z.string()
		.email('INVALID_EMAIL')
		.min(1, 'EMAIL_REQUIRED')
})

/**
 * Schema de saída para envio de email de recuperação
 */
export const SendRecoverEmailOutputSchema = z.object({
	email: z.string().email()
})

/**
 * DTO padronizado para envio de email de recuperação
 * Compatível com o sistema de registro automático
 */
export const SendRecoverEmailDTO = {
	InputSchema: SendRecoverEmailInputSchema,
	OutputSchema: SendRecoverEmailOutputSchema
}

export type SendRecoverEmailInput = z.infer<typeof SendRecoverEmailInputSchema>
export type SendRecoverEmailOutput = z.infer<typeof SendRecoverEmailOutputSchema>

export const SendRecoverEmailErrorMessages = {
	USER_NOT_FOUND: 'User not found',
	EMAIL_SEND_FAILED: 'Failed to send recovery email',
	INVALID_EMAIL_FORMAT: 'Invalid email format'
} as const

export type SendRecoverEmailError = keyof typeof SendRecoverEmailErrorMessages

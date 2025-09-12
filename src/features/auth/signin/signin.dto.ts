import { z } from 'zod'

/**
 * Schema de entrada para login
 * Segue o padrão do middleware de validação automática
 */
export const SigninInputSchema = z.object({
	email: z.string()
		.email('INVALID_EMAIL')
		.min(1, 'EMAIL_REQUIRED'),
	password: z.string()
		.min(1, 'PASSWORD_REQUIRED')
})

/**
 * Schema de saída para login
 */
export const SigninOutputSchema = z.object({
	accessToken: z.string(),
	refreshToken: z.string(),
	user: z.object({
		id: z.string(),
		username: z.string(),
		email: z.string(),
		verified: z.boolean(),
		userProfile: z.object({
			id: z.string(),
			displayName: z.string(),
			autobiography: z.string().nullable(),
			icon: z.string().nullable(),
			backgroundImage: z.string().nullable(),
			links: z.array(z.object({
				id: z.string(),
				url: z.string()
			})),
			followingCount: z.number(),
			followersCount: z.number()
		}).nullable(),
		createdAt: z.date(),
		updatedAt: z.date()
	})
})

/**
 * DTO padronizado para login
 * Compatível com o sistema de registro automático
 */
export const SigninDTO = {
	InputSchema: SigninInputSchema,
	OutputSchema: SigninOutputSchema
}

export type SigninInput = z.infer<typeof SigninInputSchema>
export type SigninOutput = z.infer<typeof SigninOutputSchema>

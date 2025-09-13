import { z } from 'zod'

/**
 * Schema de entrada para login social
 * Segue o padrão do middleware de validação automática
 */
export const SocialLoginInputSchema = z.object({
	token: z.string()
		.min(1, 'TOKEN_REQUIRED')
})

export const LinkOAuthProviderInputSchema = z.object({
	token: z.string()
		.min(1, 'Token is required')
})

export const SocialLoginOutputSchema = z.object({
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

export const LinkOAuthProviderOutputSchema = z.object({
	success: z.boolean()
})

/**
 * DTO padronizado para login social
 * Compatível com o sistema de registro automático
 */
export const SocialLoginDTO = {
	InputSchema: SocialLoginInputSchema,
	OutputSchema: SocialLoginOutputSchema
}

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

export type SocialLoginInput = z.infer<typeof SocialLoginInputSchema>
export type LinkOAuthProviderInput = z.infer<typeof LinkOAuthProviderInputSchema>
export type SocialLoginOutput = z.infer<typeof SocialLoginOutputSchema>
export type LinkOAuthProviderOutput = z.infer<typeof LinkOAuthProviderOutputSchema>

export const SupportedProviders = ['google', 'linkedin', 'github'] as const
export type SupportedProvider = typeof SupportedProviders[number]

export const SocialLoginErrorMessages = {
	USER_NOT_FOUND: 'User not found',
	PROVIDER_NOT_LINKED: 'Provider not linked to account',
	PROVIDER_ALREADY_LINKED: 'Provider already linked to account',
	INVALID_TOKEN: 'Invalid social token',
	SOCIAL_LOGIN_FAILED: 'Social login failed',
	PROVIDER_LINK_FAILED: 'Failed to link provider'
} as const

export type SocialLoginError = keyof typeof SocialLoginErrorMessages

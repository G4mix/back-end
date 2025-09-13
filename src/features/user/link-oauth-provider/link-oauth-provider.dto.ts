import { z } from 'zod'

/**
 * Schema de entrada para vincular provedor OAuth
 * Segue o padrão do middleware de validação automática
 */
export const LinkOAuthProviderInputSchema = z.object({
	token: z.string()
		.min(1, 'TOKEN_REQUIRED')
})

/**
 * Schema de parâmetros para vincular provedor OAuth
 */
export const LinkOAuthProviderParamsSchema = z.object({
	provider: z.enum(['google', 'linkedin', 'github'], {
		errorMap: () => ({ message: 'INVALID_PROVIDER' })
	})
})

/**
 * Schema de saída para vincular provedor OAuth
 */
export const LinkOAuthProviderOutputSchema = z.object({
	success: z.boolean()
})

/**
 * DTO padronizado para vincular provedor OAuth
 * Compatível com o sistema de registro automático
 */
export const LinkOAuthProviderDTO = {
	InputSchema: LinkOAuthProviderInputSchema,
	ParamsSchema: LinkOAuthProviderParamsSchema,
	OutputSchema: LinkOAuthProviderOutputSchema
}

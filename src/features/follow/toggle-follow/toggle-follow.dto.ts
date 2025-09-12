import { z } from 'zod'

/**
 * Schema de entrada para toggle de follow
 * Segue o padrão do middleware de validação automática
 */
export const ToggleFollowInputSchema = z.object({
	followingId: z.string().uuid('INVALID_USER_ID')
})

/**
 * Schema de saída para toggle de follow
 */
export const ToggleFollowOutputSchema = z.object({
	following: z.boolean(),
	message: z.string()
})

/**
 * DTO padronizado para toggle de follow
 * Compatível com o sistema de registro automático
 */
export const ToggleFollowDTO = {
	InputSchema: ToggleFollowInputSchema,
	OutputSchema: ToggleFollowOutputSchema
}

// Tipos para compatibilidade com TSOA
export interface ToggleFollowInput {
	followingId: string
}

export interface ToggleFollowResponse {
	following: boolean
	message: string
}
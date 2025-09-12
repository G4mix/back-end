import { z } from 'zod'

/**
 * Schema de entrada para toggle de like
 * Segue o padrão do middleware de validação automática
 */
export const ToggleLikeInputSchema = z.object({
	ideaId: z.string().uuid('INVALID_IDEA_ID').optional(),
	commentId: z.string().uuid('INVALID_COMMENT_ID').optional()
}).refine(data => data.ideaId || data.commentId, {
	message: 'IDEA_OR_COMMENT_REQUIRED'
})

/**
 * Schema de saída para toggle de like
 */
export const ToggleLikeOutputSchema = z.object({
	liked: z.boolean(),
	likeCount: z.number(),
	message: z.string()
})

/**
 * DTO padronizado para toggle de like
 * Compatível com o sistema de registro automático
 */
export const ToggleLikeDTO = {
	InputSchema: ToggleLikeInputSchema,
	OutputSchema: ToggleLikeOutputSchema
}

// Tipos para compatibilidade com TSOA
export interface ToggleLikeInput {
	ideaId?: string
	commentId?: string
}

export interface ToggleLikeResponse {
	liked: boolean
	likeCount: number
	message: string
}
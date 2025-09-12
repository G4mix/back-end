import { z } from 'zod'

/**
 * Schema de entrada para criação de comentário
 * Segue o padrão do middleware de validação automática
 */
export const CreateCommentInputSchema = z.object({
	ideaId: z.string().uuid('INVALID_IDEA_ID'),
	content: z.string()
		.min(1, 'CONTENT_REQUIRED')
		.max(200, 'CONTENT_TOO_LONG')
		.regex(/^[^{}]+$/, 'INVALID_CONTENT'),
	parentCommentId: z.string().uuid('INVALID_PARENT_COMMENT_ID').optional()
})

/**
 * Schema de saída para criação de comentário
 */
export const CreateCommentOutputSchema = z.object({
	comment: z.object({
		id: z.string(),
		content: z.string(),
		ideaId: z.string(),
		parentCommentId: z.string().nullable(),
		authorId: z.string(),
		author: z.object({
			id: z.string(),
			displayName: z.string().optional(),
			icon: z.string().optional()
		}),
		created_at: z.string(),
		updated_at: z.string(),
		_count: z.object({
			likes: z.number(),
			replies: z.number()
		}).optional()
	})
})

/**
 * DTO padronizado para criação de comentário
 * Compatível com o sistema de registro automático
 */
export const CreateCommentDTO = {
	InputSchema: CreateCommentInputSchema,
	OutputSchema: CreateCommentOutputSchema
}

// Tipos para compatibilidade com TSOA
export interface CreateCommentInput {
	ideaId: string
	content: string
	parentCommentId?: string
}

export interface CreateCommentResponse {
	comment: {
		id: string
		content: string
		ideaId: string
		parentCommentId?: string | null
		authorId: string
		author: {
			id: string
			displayName?: string
			icon?: string
		}
		created_at: string
		updated_at: string
		_count?: {
			likes: number
			replies: number
		}
	}
}
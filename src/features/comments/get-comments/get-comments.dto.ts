import { z } from 'zod'

/**
 * Schema de query para busca de comentários
 * Segue o padrão do middleware de validação automática
 */
export const GetCommentsQuerySchema = z.object({
	ideaId: z.string().uuid('INVALID_IDEA_ID'),
	page: z.coerce.number().int().min(0, 'INVALID_PAGE').optional(),
	limit: z.coerce.number().int().min(1, 'INVALID_LIMIT').max(100, 'LIMIT_TOO_LARGE').optional(),
	parentCommentId: z.string().uuid('INVALID_PARENT_COMMENT_ID').optional()
})

/**
 * Schema de resposta para comentário
 */
export const CommentResponseSchema = z.object({
	id: z.string(),
	content: z.string(),
	ideaId: z.string(),
	parentCommentId: z.string().nullable(),
	authorId: z.string(),
	author: z.object({
		id: z.string(),
		displayName: z.string().nullable(),
		icon: z.string().nullable()
	}),
	created_at: z.string(),
	updated_at: z.string(),
	_count: z.object({
		likes: z.number(),
		replies: z.number()
	}).optional()
})

/**
 * Schema de saída para busca de comentários
 */
export const GetCommentsOutputSchema = z.object({
	comments: z.array(CommentResponseSchema),
	pagination: z.object({
		page: z.number(),
		limit: z.number(),
		total: z.number(),
		totalPages: z.number(),
		hasNext: z.boolean(),
		hasPrev: z.boolean()
	})
})

/**
 * DTO padronizado para busca de comentários
 * Compatível com o sistema de registro automático
 */
export const GetCommentsDTO = {
	QuerySchema: GetCommentsQuerySchema,
	OutputSchema: GetCommentsOutputSchema
}

// Tipos para compatibilidade com TSOA
export interface CommentResponse {
	id: string
	content: string
	ideaId: string
	parentCommentId?: string | null
	authorId: string
	author: {
		id: string
		displayName?: string | null
		icon?: string | null
	}
	created_at: string
	updated_at: string
	_count?: {
		likes: number
		replies: number
	}
}

export interface GetCommentsResponse {
	comments: CommentResponse[]
	pagination: {
		page: number
		limit: number
		total: number
		totalPages: number
		hasNext: boolean
		hasPrev: boolean
	}
}

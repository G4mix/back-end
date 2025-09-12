import { z } from 'zod'

/**
 * Schema de query para busca de ideias
 * Segue o padrão do middleware de validação automática
 */
export const GetIdeasQuerySchema = z.object({
	search: z.string().optional(),
	authorId: z.string().uuid('INVALID_AUTHOR_ID').optional(),
	tags: z.array(z.string()).optional(),
	page: z.coerce.number().int().min(0, 'INVALID_PAGE').optional(),
	limit: z.coerce.number().int().min(1, 'INVALID_LIMIT').max(100, 'LIMIT_TOO_LARGE').optional(),
	sortBy: z.enum(['created_at', 'updated_at', 'title']).optional(),
	sortOrder: z.enum(['asc', 'desc']).optional()
})

/**
 * Schema de resposta para ideia
 */
export const IdeaResponseSchema = z.object({
	id: z.string(),
	title: z.string().nullable(),
	description: z.string().nullable(),
	authorId: z.string(),
	author: z.object({
		id: z.string(),
		displayName: z.string().nullable(),
		icon: z.string().nullable()
	}),
	tags: z.array(z.object({
		id: z.string(),
		name: z.string()
	})).optional(),
	images: z.array(z.object({
		id: z.string(),
		src: z.string(),
		alt: z.string(),
		width: z.number(),
		height: z.number()
	})).optional(),
	links: z.array(z.object({
		id: z.string(),
		url: z.string()
	})).optional(),
	created_at: z.string(),
	updated_at: z.string(),
	_count: z.object({
		likes: z.number(),
		views: z.number(),
		comments: z.number()
	}).optional()
})

/**
 * Schema de saída para busca de ideias
 */
export const GetIdeasOutputSchema = z.object({
	ideas: z.array(IdeaResponseSchema),
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
 * DTO padronizado para busca de ideias
 * Compatível com o sistema de registro automático
 */
export const GetIdeasDTO = {
	QuerySchema: GetIdeasQuerySchema,
	OutputSchema: GetIdeasOutputSchema
}

export type GetIdeasQuery = z.infer<typeof GetIdeasQuerySchema>
export type IdeaResponse = z.infer<typeof IdeaResponseSchema>
export type GetIdeasOutput = z.infer<typeof GetIdeasOutputSchema>
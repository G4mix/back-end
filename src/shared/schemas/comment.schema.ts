import { z } from 'zod'

export const createCommentSchema = z.object({
	ideaId: z.string().uuid('INVALID_IDEA_ID'),
	content: z.string()
		.min(1, 'CONTENT_REQUIRED')
		.max(200, 'CONTENT_TOO_LONG')
		.regex(/^[^{}]+$/, 'INVALID_CONTENT'),
	parentCommentId: z.string().uuid('INVALID_PARENT_COMMENT_ID').optional()
})

export const getCommentsSchema = z.object({
	ideaId: z.string().uuid('INVALID_IDEA_ID'),
	page: z.number().int().min(0, 'INVALID_PAGE').optional(),
	limit: z.number().int().min(1, 'INVALID_LIMIT').max(100, 'LIMIT_TOO_LARGE').optional(),
	parentCommentId: z.string().uuid('INVALID_PARENT_COMMENT_ID').optional()
})

import { z } from 'zod'

export const toggleLikeSchema = z.object({
	ideaId: z.string().uuid('INVALID_IDEA_ID'),
	commentId: z.string().uuid('INVALID_COMMENT_ID').optional()
}).refine(data => data.ideaId || data.commentId, {
	message: 'IDEA_OR_COMMENT_REQUIRED'
})

export const recordViewSchema = z.object({
	ideas: z.array(z.string().uuid('INVALID_IDEA_ID'))
		.min(1, 'IDEAS_REQUIRED')
		.max(10, 'TOO_MANY_IDEAS')
})

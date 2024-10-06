import { z } from 'zod'

export const commentSchema = z.object({
	content: z.undefined().or(z.string().regex(/^[^{}]{3,200}$/, 'INVALID_CONTENT'))
})
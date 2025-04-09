import { z } from 'zod'

export const postSchema = z.object({
	title: z.undefined().or(z.string().regex(/^[^{}]{3,70}$/, 'INVALID_TITLE')),
	content: z.undefined().or(z.string().regex(/^[^{}]{3,700}$/, 'INVALID_CONTENT'))
})
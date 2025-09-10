import { z } from 'zod'

export const addLinkSchema = z.object({
	url: z.string()
		.url('INVALID_URL')
		.max(700, 'URL_TOO_LONG')
		.regex(/^https?:\/\//, 'URL_MUST_START_WITH_HTTP')
})

export const getLinksSchema = z.object({
	userId: z.string().uuid('INVALID_USER_ID').optional()
})

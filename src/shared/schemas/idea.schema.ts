import { z } from 'zod'

export const createIdeaSchema = z.object({
	title: z.string()
		.min(10, 'TITLE_TOO_SHORT')
		.max(70, 'TITLE_TOO_LONG')
		.regex(/^[^{}]+$/, 'INVALID_TITLE'),
	description: z.string()
		.min(50, 'DESCRIPTION_TOO_SHORT')
		.max(700, 'DESCRIPTION_TOO_LONG')
		.regex(/^[^{}]+$/, 'INVALID_DESCRIPTION'),
	tags: z.array(z.string().min(1, 'TAG_EMPTY').max(50, 'TAG_TOO_LONG')).optional(),
	images: z.array(z.any()).optional(), // Express.Multer.File[]
	links: z.array(z.object({
		url: z.string().url('INVALID_LINK_URL').max(700, 'LINK_URL_TOO_LONG')
	})).optional()
})

export const updateIdeaSchema = z.object({
	title: z.string()
		.min(10, 'TITLE_TOO_SHORT')
		.max(70, 'TITLE_TOO_LONG')
		.regex(/^[^{}]+$/, 'INVALID_TITLE')
		.optional(),
	description: z.string()
		.min(50, 'DESCRIPTION_TOO_SHORT')
		.max(700, 'DESCRIPTION_TOO_LONG')
		.regex(/^[^{}]+$/, 'INVALID_DESCRIPTION')
		.optional(),
	tags: z.array(z.string().min(1, 'TAG_EMPTY').max(50, 'TAG_TOO_LONG')).optional(),
	images: z.array(z.any()).optional(), // Express.Multer.File[]
	links: z.array(z.object({
		url: z.string().url('INVALID_LINK_URL').max(700, 'LINK_URL_TOO_LONG')
	})).optional()
})

export const getIdeasSchema = z.object({
	search: z.string().optional(),
	authorId: z.string().uuid('INVALID_AUTHOR_ID').optional(),
	tags: z.string().optional(),
	page: z.number().int().min(0, 'INVALID_PAGE').optional(),
	limit: z.number().int().min(1, 'INVALID_LIMIT').max(100, 'LIMIT_TOO_LARGE').optional(),
	sortBy: z.enum(['created_at', 'updated_at', 'title']).optional(),
	sortOrder: z.enum(['asc', 'desc']).optional()
})

import { z } from 'zod'

export const toggleFollowSchema = z.object({
	followingId: z.string().uuid('INVALID_USER_ID')
})

export const getFollowersSchema = z.object({
	userId: z.string().uuid('INVALID_USER_ID'),
	page: z.number().int().min(0, 'INVALID_PAGE').optional(),
	limit: z.number().int().min(1, 'INVALID_LIMIT').max(100, 'LIMIT_TOO_LARGE').optional()
})

export const getFollowingSchema = z.object({
	userId: z.string().uuid('INVALID_USER_ID'),
	page: z.number().int().min(0, 'INVALID_PAGE').optional(),
	limit: z.number().int().min(1, 'INVALID_LIMIT').max(100, 'LIMIT_TOO_LARGE').optional()
})

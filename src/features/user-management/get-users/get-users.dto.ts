import { z } from 'zod'

// Input DTOs
export const getUsersQuerySchema = z.object({
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(10),
	search: z.string().optional()
})

// Output DTOs
export const getUsersResponseSchema = z.object({
	users: z.array(z.object({
		id: z.string(),
		username: z.string(),
		email: z.string(),
		verified: z.boolean(),
		created_at: z.string(),
		updated_at: z.string(),
		userProfile: z.object({
			id: z.string(),
			icon: z.string().nullable(),
			displayName: z.string().nullable(),
			autobiography: z.string().nullable(),
			backgroundImage: z.string().nullable(),
			isFollowing: z.boolean(),
			links: z.array(z.string()),
			followersCount: z.number(),
			followingCount: z.number()
		}).nullable()
	})),
	pagination: z.object({
		page: z.number(),
		limit: z.number(),
		total: z.number()
	})
})

export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>
export type GetUsersResponse = z.infer<typeof getUsersResponseSchema>

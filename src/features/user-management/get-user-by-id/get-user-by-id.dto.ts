import { z } from 'zod'

// Input DTOs
export const getUserByIdParamsSchema = z.object({
	userId: z.string().uuid('Invalid user ID format')
})

// Output DTOs
export const getUserByIdResponseSchema = z.object({
	user: z.object({
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
	})
})

export const getUserByIdErrorSchema = z.object({
	message: z.enum(['USER_NOT_FOUND'])
})

export type GetUserByIdParams = z.infer<typeof getUserByIdParamsSchema>
export type GetUserByIdResponse = z.infer<typeof getUserByIdResponseSchema>
export type GetUserByIdError = z.infer<typeof getUserByIdErrorSchema>

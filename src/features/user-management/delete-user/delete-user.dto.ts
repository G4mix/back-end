import { z } from 'zod'

// Input DTOs
export const deleteUserParamsSchema = z.object({
	userId: z.string().uuid('Invalid user ID format')
})

// Output DTOs
export const deleteUserSuccessSchema = z.object({
	message: z.enum(['USER_DELETED_SUCCESSFULLY'])
})

export const deleteUserErrorSchema = z.object({
	message: z.enum(['USER_NOT_FOUND', 'FORBIDDEN'])
})

export type DeleteUserParams = z.infer<typeof deleteUserParamsSchema>
export type DeleteUserSuccess = z.infer<typeof deleteUserSuccessSchema>
export type DeleteUserError = z.infer<typeof deleteUserErrorSchema>

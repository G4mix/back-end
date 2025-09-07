import { z } from 'zod'

export const updateUserSchema = z.object({
	username: z.string()
		.min(3, 'USERNAME_TOO_SHORT')
		.max(255, 'USERNAME_TOO_LONG')
		.regex(/^[a-zA-Z0-9_]+$/, 'INVALID_USERNAME_FORMAT')
		.optional(),
	email: z.string()
		.email('INVALID_EMAIL_FORMAT')
		.max(255, 'EMAIL_TOO_LONG')
		.optional(),
	password: z.string()
		.min(8, 'PASSWORD_TOO_SHORT')
		.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'INVALID_PASSWORD_FORMAT')
		.optional(),
	displayName: z.string()
		.max(255, 'DISPLAY_NAME_TOO_LONG')
		.optional(),
	autobiography: z.string()
		.max(1000, 'AUTOBIOGRAPHY_TOO_LONG')
		.optional(),
	links: z.array(z.string().url('INVALID_URL_FORMAT'))
		.max(5, 'TOO_MANY_LINKS')
		.optional(),
	icon: z.any().optional(), // Express.Multer.File
	backgroundImage: z.any().optional() // Express.Multer.File
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>

export interface UpdateUserOutput {
	user: {
		id: string
		username: string
		email: string
		verified: boolean
		userProfile: {
			id: string
			displayName: string
			autobiography: string | null
			icon: string | null
			backgroundImage: string | null
			links: Array<{ id: string; url: string }>
			followingCount: number
			followersCount: number
		} | null
		createdAt: Date
		updatedAt: Date
	}
}

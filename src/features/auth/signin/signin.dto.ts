import { z } from 'zod'

export const signinSchema = z.object({
	email: z.string()
		.email('INVALID_EMAIL_FORMAT')
		.max(255, 'EMAIL_TOO_LONG'),
	password: z.string()
		.min(1, 'PASSWORD_REQUIRED')
})

export type SigninInput = z.infer<typeof signinSchema>

export interface SigninOutput {
	accessToken: string
	refreshToken: string
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

import { User, UserProfile } from '@prisma/client'

type UserWithProfile = User & { userProfile: UserProfile }

export const serializeUser = (user: UserWithProfile) => {
	return {
		id: user.id,
		username: user.username,
		email: user.email,
		verified: user.verified,
		created_at: user.created_at.toISOString(),
		userProfile: {
			id: user.userProfile.id,
			icon: user.userProfile.icon,
			displayName: user.userProfile.displayName
		}
	}
}

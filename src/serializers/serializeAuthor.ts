import { User, UserProfile } from '@prisma/client'

type AuthorWithUser = UserProfile & { user: User | null }

export const serializeAuthor = (author: AuthorWithUser) => {
	return {
		id: author.id,
		icon: author.icon,
		displayName: author.displayName,
		user: author.user && {
			id: author.user.id,
			username: author.user.username,
			email: author.user.email,
			verified: author.user.verified,
			created_at: author.user.created_at.toISOString()
		}
	}
}

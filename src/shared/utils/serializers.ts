import { Link, User, UserProfile } from '@prisma/client'

export type UserWithProfile = User & {
	userProfile: UserProfile & {
		links: Link[];
		isFollowing?: boolean;
		_count: {
			following: number;
			followers: number;
		}
	}
}

export const serializeUser = (user: UserWithProfile) => {
	return {
		id: user.id,
		username: user.username,
		email: user.email,
		verified: user.verified,
		created_at: new Date(user.created_at).toISOString(),
		updated_at: new Date(user.updated_at).toISOString(),
		userProfile: {
			id: user.userProfile.id,
			icon: user.userProfile.icon,
			displayName: user.userProfile.displayName,
			autobiography: user.userProfile.autobiography,
			backgroundImage: user.userProfile.backgroundImage,
			isFollowing: user.userProfile.isFollowing,
			links: user.userProfile.links,
			followersCount: user.userProfile._count.followers,
			followingCount: user.userProfile._count.following
		}
	}
}

export const serializeAuthor = (author: any) => {
	return {
		id: author.user?.id || author.id,
		username: author.user?.username || author.username,
		email: author.user?.email || author.email,
		verified: author.user?.verified || author.verified,
		created_at: new Date(author.user?.created_at || author.created_at).toISOString(),
		updated_at: new Date(author.user?.updated_at || author.updated_at)?.toISOString(),
		userProfile: {
			id: author.id,
			icon: author.icon,
			displayName: author.displayName,
			autobiography: author.autobiography,
			backgroundImage: author.backgroundImage,
			isFollowing: author.isFollowing,
			links: author.links || [],
			followersCount: author._count?.followers || 0,
			followingCount: author._count?.following || 0
		}
	}
}

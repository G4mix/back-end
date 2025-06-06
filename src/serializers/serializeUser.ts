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
		created_at: user.created_at.toISOString(),
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

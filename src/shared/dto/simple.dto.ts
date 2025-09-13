import { Link, User, UserProfile } from '@prisma/client'

/**
 * DTOs simplificados que funcionam apenas com o middleware inteligente
 * Estes DTOs são injetados automaticamente pelo middleware
 */

// ========================================
// TIPOS PRISMA COM DTOs
// ========================================

/**
 * Tipo para usuário com perfil completo do Prisma
 * Agora está no DTO para ser a fonte única da verdade
 */
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

// ========================================
// USER DTOs
// ========================================

export class UserProfileDTO {
	id!: string
	icon?: string | null
	displayName?: string | null
	autobiography?: string | null
	backgroundImage?: string | null
	links?: Link[]
	followersCount!: number
	followingCount!: number
	isFollowing?: boolean | undefined

	constructor(data?: any) {
		if (data) {
			this.fromRaw(data)
		}
	}

	fromRaw(data: any): this {
		this.id = data.id
		this.icon = data.icon ?? null
		this.displayName = data.displayName ?? null
		this.autobiography = data.autobiography ?? null
		this.backgroundImage = data.backgroundImage ?? null
		this.links = data.links || []
		this.followersCount = data._count?.followers || 0
		this.followingCount = data._count?.following || 0
		this.isFollowing = data.isFollowing
		return this
	}

	toJSON() {
		return {
			id: this.id,
			icon: this.icon ?? null,
			displayName: this.displayName ?? null,
			autobiography: this.autobiography ?? null,
			backgroundImage: this.backgroundImage ?? null,
			links: this.links || [],
			followersCount: this.followersCount,
			followingCount: this.followingCount,
			isFollowing: this.isFollowing ?? undefined
		}
	}
}

export class UserDTO {
	id!: string
	email!: string
	username!: string
	verified!: boolean
	created_at!: string
	updated_at!: string
	userProfile!: UserProfileDTO

	constructor(data?: any) {
		if (data) {
			this.fromRaw(data)
		}
	}

	fromRaw(data: any): this {
		this.id = data.id
		this.email = data.email
		this.username = data.username
		this.verified = data.verified
		this.created_at = data.created_at instanceof Date ? data.created_at.toISOString() : data.created_at
		this.updated_at = data.updated_at instanceof Date ? data.updated_at.toISOString() : data.updated_at
		this.userProfile = new UserProfileDTO(data.userProfile)
		return this
	}

	toJSON() {
		return {
			id: this.id,
			email: this.email,
			username: this.username,
			verified: this.verified,
			created_at: this.created_at,
			updated_at: this.updated_at,
			userProfile: this.userProfile.toJSON()
		}
	}
}

// ========================================
// COMMENT DTOs
// ========================================

export class CommentAuthorDTO {
	id!: string
	displayName?: string | null
	icon?: string | null

	constructor(data?: any) {
		if (data) {
			this.fromRaw(data)
		}
	}

	fromRaw(data: any): this {
		this.id = data.id
		this.displayName = data.displayName
		this.icon = data.icon
		return this
	}

	toJSON() {
		return {
			id: this.id,
			displayName: this.displayName,
			icon: this.icon
		}
	}
}

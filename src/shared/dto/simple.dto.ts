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

export class CommentDTO {
	id!: string
	content!: string
	authorId!: string
	ideaId!: string
	parentCommentId?: string | null
	created_at!: string
	updated_at!: string
	author!: CommentAuthorDTO
	likesCount!: number
	repliesCount!: number
	isLiked!: boolean

	constructor(data?: any) {
		if (data) {
			this.fromRaw(data)
		}
	}

	fromRaw(data: any): this {
		this.id = data.id
		this.content = data.content
		this.authorId = data.authorId
		this.ideaId = data.ideaId
		this.parentCommentId = data.parentCommentId
		this.created_at = data.created_at instanceof Date ? data.created_at.toISOString() : data.created_at
		this.updated_at = data.updated_at instanceof Date ? data.updated_at.toISOString() : data.updated_at
		this.author = new CommentAuthorDTO(data.author)
		this.likesCount = data._count?.likes || 0
		this.repliesCount = data._count?.replies || 0
		this.isLiked = data.isLiked || false
		return this
	}

	toJSON() {
		return {
			id: this.id,
			content: this.content,
			authorId: this.authorId,
			ideaId: this.ideaId,
			parentCommentId: this.parentCommentId,
			created_at: this.created_at,
			updated_at: this.updated_at,
			author: this.author.toJSON(),
			likesCount: this.likesCount,
			repliesCount: this.repliesCount,
			isLiked: this.isLiked
		}
	}
}

// ========================================
// IDEA DTOs
// ========================================

export class IdeaAuthorDTO {
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

export class IdeaDTO {
	id!: string
	title!: string | null
	description!: string | null
	authorId!: string
	created_at!: string
	updated_at!: string
	author!: IdeaAuthorDTO
	likesCount!: number
	commentsCount!: number
	viewsCount!: number
	isLiked!: boolean

	constructor(data?: any) {
		if (data) {
			this.fromRaw(data)
		}
	}

	fromRaw(data: any): this {
		this.id = data.id
		this.title = data.title
		this.description = data.description
		this.authorId = data.authorId
		this.created_at = data.created_at instanceof Date ? data.created_at.toISOString() : data.created_at
		this.updated_at = data.updated_at instanceof Date ? data.updated_at.toISOString() : data.updated_at
		this.author = new IdeaAuthorDTO(data.author)
		this.likesCount = data._count?.likes || 0
		this.commentsCount = data._count?.comments || 0
		this.viewsCount = data._count?.views || 0
		this.isLiked = data.isLiked || false
		return this
	}

	toJSON() {
		return {
			id: this.id,
			title: this.title,
			description: this.description,
			authorId: this.authorId,
			created_at: this.created_at,
			updated_at: this.updated_at,
			author: this.author.toJSON(),
			likesCount: this.likesCount,
			commentsCount: this.commentsCount,
			viewsCount: this.viewsCount,
			isLiked: this.isLiked
		}
	}
}

// ========================================
// INPUT/OUTPUT DTOs
// ========================================

export class CreateCommentInputDTO {
	ideaId!: string
	content!: string
	parentCommentId?: string | null

	constructor(data?: any) {
		if (data) {
			this.fromRaw(data)
		}
	}

	fromRaw(data: any): this {
		this.ideaId = data.ideaId
		this.content = data.content
		this.parentCommentId = data.parentCommentId
		return this
	}
}

export class CreateCommentResponseDTO {
	comment!: CommentDTO

	constructor(data?: any) {
		if (data) {
			this.fromRaw(data)
		}
	}

	fromRaw(data: any): this {
		this.comment = new CommentDTO(data.comment)
		return this
	}

	toJSON() {
		return {
			comment: this.comment.toJSON()
		}
	}
}

export class GetUserByIdResponseDTO {
	user!: UserDTO

	constructor(data?: any) {
		if (data) {
			this.fromRaw(data)
		}
	}

	fromRaw(data: any): this {
		this.user = new UserDTO(data.user)
		return this
	}

	toJSON() {
		return {
			user: this.user.toJSON()
		}
	}
}

export class GetIdeasResponseDTO {
	ideas!: IdeaDTO[]
	pagination!: {
		page: number
		nextPage: number | null
		totalPages: number
		totalItems: number
	}

	constructor(data?: any) {
		if (data) {
			this.fromRaw(data)
		}
	}

	fromRaw(data: any): this {
		this.ideas = (data.ideas || []).map((idea: any) => new IdeaDTO(idea))
		this.pagination = data.pagination || {
			page: 1,
			nextPage: null,
			totalPages: 1,
			totalItems: 0
		}
		return this
	}

	toJSON() {
		return {
			ideas: this.ideas.map(idea => idea.toJSON()),
			pagination: this.pagination
		}
	}
}
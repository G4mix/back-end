/**
 * Interfaces simples para o TSOA
 * Os DTOs reais estão em @shared/dto/simple.dto.ts
 */

// Input interfaces
export interface CreateCommentInput {
	ideaId: string
	content: string
	parentCommentId?: string
}

export interface CreateIdeaInput {
	title: string
	description: string
	tags?: string[]
	images?: Express.Multer.File[]
	links?: Array<{
		url: string
	}>
}

// Response interfaces
export interface UserProfile {
	id: string
	icon?: string | null
	displayName?: string | null
	autobiography?: string | null
	backgroundImage?: string | null
	isFollowing?: boolean
	links: Array<{
		id: string
		url: string
		platform: string
	}>
	followersCount: number
	followingCount: number
}

export interface User {
	id: string
	username: string
	email: string
	verified: boolean
	created_at: string
	updated_at: string
	userProfile: UserProfile | null
}

export interface CommentAuthor {
	id: string
	displayName?: string
	icon?: string
}

export interface Comment {
	id: string
	content: string
	ideaId: string
	parentCommentId?: string | null
	authorId: string
	author: CommentAuthor
	created_at: string
	updated_at: string
	_count: {
		likes: number
		replies: number
	}
}

export interface IdeaAuthor {
	id: string
	displayName?: string
	icon?: string
}

export interface Idea {
	id: string
	title: string
	description: string
	authorId: string
	author: IdeaAuthor
	tags?: Array<{
		id: string
		name: string
	}>
	images?: Array<{
		id: string
		src: string
		alt: string
		width: number
		height: number
	}>
	links?: Array<{
		id: string
		url: string
	}>
	created_at: string
	updated_at: string
	_count: {
		likes: number
		views: number
		comments: number
	}
}

// Response DTOs
export interface GetUserByIdResponse {
	user: User
}

export interface CreateCommentResponse {
	comment: Comment
}

export interface GetIdeasResponse {
	ideas: Idea[]
	pagination: {
		page: number
		limit: number
		total: number
		totalPages?: number
		hasNext?: boolean
		hasPrev?: boolean
	}
}

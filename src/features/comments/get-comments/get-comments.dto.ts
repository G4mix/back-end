export class GetCommentsResponse {
	comments!: CommentResponse[]
	pagination!: {
		page: number
		limit: number
		total: number
		totalPages: number
		hasNext: boolean
		hasPrev: boolean
	}
}

export class CommentResponse {
	id!: string
	content!: string
	ideaId!: string
	parentCommentId?: string | null
	authorId!: string
	author!: {
		id: string
		displayName?: string | null
		icon?: string | null
	}
	created_at!: string
	updated_at!: string
	_count?: {
		likes: number
		replies: number
	}
}

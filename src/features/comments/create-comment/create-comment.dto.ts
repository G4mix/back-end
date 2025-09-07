export class CreateCommentInput {
	ideaId!: string
	content!: string
	parentCommentId?: string
}

export class CreateCommentResponse {
	comment!: {
		id: string
		content: string
		ideaId: string
		parentCommentId?: string | null
		authorId: string
		author: {
			id: string
			displayName?: string
			icon?: string
		}
		created_at: string
		updated_at: string
		_count?: {
			likes: number
			replies: number
		}
	}
}
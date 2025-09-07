export class GetIdeaByIdResponse {
	idea!: {
		id: string
		title: string | null
		description: string | null
		authorId: string
		author: {
			id: string
			displayName?: string | null
			icon?: string | null
		}
		created_at: string
		updated_at: string
		_count?: {
			likes: number
			views: number
			comments: number
		}
	}
}

export class GetIdeasQuery {
	search?: string
	authorId?: string
	tags?: string
	page?: number
	limit?: number
	sortBy?: 'created_at' | 'updated_at' | 'title'
	sortOrder?: 'asc' | 'desc'
}

export class IdeaResponse {
	id!: string
	title!: string | null
	description!: string | null
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
		views: number
		comments: number
	}
}

export class GetIdeasResponse {
	ideas!: IdeaResponse[]
	pagination!: {
		page: number
		limit: number
		total: number
		totalPages: number
		hasNext: boolean
		hasPrev: boolean
	}
}
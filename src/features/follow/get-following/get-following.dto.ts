export class GetFollowingQuery {
	userId!: string
	page?: number
	limit?: number
}

export class FollowingResponse {
	id!: string
	followingUser!: {
		id: string
		displayName?: string | null
		icon?: string | null
		username?: string
	}
	created_at!: string
}

export class GetFollowingResponse {
	following!: FollowingResponse[]
	pagination!: {
		page: number
		limit: number
		total: number
		totalPages: number
		hasNext: boolean
		hasPrev: boolean
	}
}

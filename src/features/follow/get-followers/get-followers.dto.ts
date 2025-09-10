export class GetFollowersQuery {
	userId!: string
	page?: number
	limit?: number
}

export class FollowerResponse {
	id!: string
	followerUser!: {
		id: string
		displayName?: string | null
		icon?: string | null
		username?: string
	}
	created_at!: string
}

export class GetFollowersResponse {
	followers!: FollowerResponse[]
	pagination!: {
		page: number
		limit: number
		total: number
		totalPages: number
		hasNext: boolean
		hasPrev: boolean
	}
}

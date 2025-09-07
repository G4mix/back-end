export class ToggleFollowInput {
	followingId!: string
	followingType!: 'user' | 'company'
}

export class ToggleFollowResponse {
	following!: boolean
	followerCount!: number
	message!: string
}
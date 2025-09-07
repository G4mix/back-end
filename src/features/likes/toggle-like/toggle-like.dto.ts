export class ToggleLikeInput {
	ideaId!: string
	commentId?: string
}

export class ToggleLikeResponse {
	liked!: boolean
	likeCount!: number
	message!: string
}
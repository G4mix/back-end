export class RecordViewInput {
	ideaId!: string
	commentId?: string
}

export class RecordViewResponse {
	viewed!: boolean
	viewCount!: number
	message!: string
}
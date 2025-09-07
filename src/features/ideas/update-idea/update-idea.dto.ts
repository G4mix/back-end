export class UpdateIdeaInput {
	title?: string
	description?: string
}

export class UpdateIdeaResponse {
	idea!: {
		id: string
		title: string | null
		description: string | null
		authorId: string
		created_at: string
		updated_at: string
	}
}

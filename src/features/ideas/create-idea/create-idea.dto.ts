export class CreateIdeaInput {
	title!: string
	description!: string
}

export class CreateIdeaResponse {
	idea!: {
		id: string
		title: string | null
		description: string | null
		authorId: string
		created_at: string
		updated_at: string
	}
}
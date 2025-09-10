export class UpdateIdeaInput {
	title?: string
	description?: string
	tags?: string[]
	images?: Express.Multer.File[]
	links?: Array<{
		url: string
	}>
}

export class UpdateIdeaResponse {
	idea!: {
		id: string
		title: string | null
		description: string | null
		authorId: string
		tags?: Array<{
			id: string
			name: string
		}>
		images?: Array<{
			id: string
			src: string
			alt: string
			width: number
			height: number
		}>
		links?: Array<{
			id: string
			url: string
		}>
		created_at: string
		updated_at: string
	}
}

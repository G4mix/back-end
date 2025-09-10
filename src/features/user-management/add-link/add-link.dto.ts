export class AddLinkInput {
	url!: string
}

export class AddLinkResponse {
	link!: {
		id: string
		url: string
		created_at: string
	}
}

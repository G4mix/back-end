export class LinkResponse {
	id!: string
	url!: string
	created_at!: string
}

export class GetLinksResponse {
	links!: LinkResponse[]
}

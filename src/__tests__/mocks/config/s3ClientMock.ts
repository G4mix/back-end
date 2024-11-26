export class S3ClientMock {
	private _throwError: boolean = false
	private _type: 'send' = 'send'
	private _fileUrl: string | undefined = 'https://localhost:8080/image.png'

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async send(_something: any) {
		if (this._throwError) throw new Error('a error')
		const types = {
			send: { fileUrl: this._fileUrl }
		}
		return types[this._type]
	}

	public setThrowError(value: boolean) {
		this._throwError = value
		return this
	}
	public setType(type: typeof this._type) {
		this._type = type
		return this
	}
	public setFileUrl(fileUrl: typeof this._fileUrl) {
		this._fileUrl = fileUrl
		return this
	}
}

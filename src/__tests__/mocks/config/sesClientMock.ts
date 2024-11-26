import { setup } from '@setup'

export class SESClientMock {
	private _throwError: boolean = false
	private _type: 'send' | 'status-not-found' | 'status' | 'verify' = 'send'
	private _status: 'Success' | 'Pending' = 'Success'

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async send(_something: any) {
		if (this._throwError) throw new Error('a error')
		const types = {
			send: { MessageId: 'aaaaa' },
			'status-not-found': {},
			status: { VerificationAttributes: { [setup['testUser']['email']]: { VerificationStatus: this._status } } },
			verify: undefined
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
	public setStatus(status: typeof this._status) {
		this._status = status
		return this
	}
}

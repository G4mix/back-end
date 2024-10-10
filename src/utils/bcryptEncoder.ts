import * as bcrypt from 'bcryptjs'

export class BCryptEncoder {
	static encode(password: string): string {
		return bcrypt.hashSync(password, bcrypt.genSaltSync(10))
	}
	static compare(password: string, hash: string): boolean {
		return bcrypt.compareSync(password, hash)
	}
}
import { injectable, singleton } from 'tsyringe'
import { S3Gateway } from './s3.gateway'

@injectable()
@singleton()
export class UserGateway {
	constructor(
		private s3Gateway: S3Gateway
	) {}

	public async uploadUserIcon({ file }: { file: Express.Multer.File }) {
		return await this.s3Gateway.uploadFile({ file, folder: 'users/icons' })
	}

	public async uploadUserBackground({ file }: { file: Express.Multer.File }) {
		return await this.s3Gateway.uploadFile({ file, folder: 'users/backgrounds' })
	}

	public async deleteUserFile({ key }: { key: string }) {
		return await this.s3Gateway.deleteFile({ key })
	}
}

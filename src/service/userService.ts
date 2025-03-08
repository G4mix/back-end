import { injectable, singleton } from 'tsyringe'
import { UserRepository } from '@repository'
import { BCryptEncoder, JwtManager } from '@utils'
import { MAX_SIZE, SUPPORTED_IMAGES } from '@constants'
import { S3Service } from './s3Service'
import { env } from '@config'

@injectable()
@singleton()
export class UserService {
	constructor(
		private userRepository: UserRepository,
		private s3Service: S3Service
	) {}

	public async update(data: { id: string; username?: string; email?: string; password?: string; icon?: Express.Multer.File | string; verified?: boolean; }) {
		if (data.email) {
			if (await this.userRepository.findByEmail({ email: data.email })) return 'USER_ALREADY_EXISTS'
			data.verified = false
		}
		if (data.password) data.password = BCryptEncoder.encode(data.password)
		if (data.icon && typeof data.icon !== 'string') {
			if (!Object.keys(SUPPORTED_IMAGES).includes(data.icon.mimetype)) return 'INVALID_IMAGE_FORMAT'
			if (data.icon.size > MAX_SIZE) return 'EXCEEDED_MAX_SIZE'
			const userIconRes = await this.s3Service.uploadFile({
				bucketName: env.PUBLIC_BUCKET_NAME,
				key: `user-${data.id}/icon${SUPPORTED_IMAGES[data.icon.mimetype as keyof typeof SUPPORTED_IMAGES]}`,
				file: data.icon.buffer
			})
			if (typeof userIconRes !== 'object') return 'PICTURE_UPDATE_FAIL'
			if (userIconRes.fileUrl) data['icon'] = userIconRes.fileUrl
			else data['icon'] = undefined
		}
		const user = await this.userRepository.update(data)
		return { token: JwtManager.generateToken({ sub: user.id }), user }
	}

	public async delete({ id }: { id: string; }) {
		return await this.userRepository.delete({ id })
	}
}
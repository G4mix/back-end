import { injectable, singleton } from 'tsyringe'
import { UserRepository } from '@repository'
import { BCryptEncoder } from '@utils'
import { MAX_SIZE, SUPPORTED_IMAGES } from '@constants'
import { S3Service } from './s3Service'
import { env } from '@config'
import { serializeUser } from '@serializers'

@injectable()
@singleton()
export class UserService {
	constructor(
		private userRepository: UserRepository,
		private s3Service: S3Service
	) {}

	public async findAll({ search, page, quantity }: { search: string; page: number; quantity: number; }) {
		return await this.userRepository.findAll({ search, page, quantity })
	}

	public async existsByEmail({ email }: { email: string; }) {
		const count = await this.userRepository.count({ email })
		return count > 0 ? { exists: true } : 'USER_NOT_FOUND'
	}

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
		return serializeUser(await this.userRepository.update(data))
	}

	public async delete({ id }: { id: string; }) {
		return await this.userRepository.delete({ id })
	}
}
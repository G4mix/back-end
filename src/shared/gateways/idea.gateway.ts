import { injectable, inject } from 'tsyringe'
import { S3Gateway } from './s3.gateway'
import { Logger } from '@shared/utils/logger'

@injectable()
export class IdeaGateway {
	constructor(
		@inject('S3Gateway') private s3Gateway: S3Gateway,
		@inject('Logger') private logger: Logger
	) {}

	public async uploadIdeaImages({ files }: { files: Express.Multer.File[] }) {
		const uploadedImages = []

		for (const file of files) {
			try {
				const uploadResult = await this.s3Gateway.uploadFile({
					file,
					folder: 'ideas'
				})

				if (typeof uploadResult === 'string') {
					throw new Error(uploadResult)
				}

				uploadedImages.push({
					src: uploadResult.url,
					alt: file.originalname || 'Idea image',
					width: 800, // Default width, could be extracted from image metadata
					height: 600  // Default height, could be extracted from image metadata
				})

				this.logger.info('Idea image uploaded successfully', {
					originalName: file.originalname,
					uploadedUrl: uploadResult.url,
					fileSize: file.size
				})
			} catch (error) {
				this.logger.error('Failed to upload idea image', {
					originalName: file.originalname,
					error: error instanceof Error ? error.message : 'Unknown error'
				})
				throw error
			}
		}

		return uploadedImages
	}

	public async deleteIdeaImages({ imageUrls }: { imageUrls: string[] }) {
		for (const imageUrl of imageUrls) {
			try {
				// Extract key from URL
				const key = imageUrl.replace('https://gamix-app-prod.s3.amazonaws.com/', '')
				await this.s3Gateway.deleteFile({ key })
				this.logger.info('Idea image deleted successfully', { imageUrl })
			} catch (error) {
				this.logger.error('Failed to delete idea image', {
					imageUrl,
					error: error instanceof Error ? error.message : 'Unknown error'
				})
				// Don't throw error for individual image deletion failures
			}
		}
	}
}

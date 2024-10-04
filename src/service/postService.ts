import { SUPPORTED_IMAGES, MAX_SIZE } from '@constants'
import { injectable, singleton } from 'tsyringe'
import { PostRepository } from '@repository'
import { S3Service } from './s3Service'
import { env } from '@config'
import sizeOf from 'image-size'

@injectable()
@singleton()
export class PostService {
	constructor(
        private postRepository: PostRepository,
				private s3Service: S3Service
	) {}

	public async createPost({
		userProfileId, title, content, links, tags, images
	}: {
		userProfileId: string;
		title?: string;
		content?: string;
		links?: string[];
		tags?: string[];
		images?: Express.Multer.File[];
	}) {
		const uploadedImages: {
			src: string;
			alt: string;
			width: number;
			height: number;
		}[] = []

		if (images) {
			for (const image of images) {
				if (!Object.keys(SUPPORTED_IMAGES).includes(image.mimetype) || image.size > MAX_SIZE) continue

				const postImageRes = await this.s3Service.uploadFile({
					bucketName: env.PUBLIC_BUCKET_NAME,
					key: `user-${userProfileId}/${image.originalname}`,
					file: image.buffer
				})

				if (typeof postImageRes === 'object' && postImageRes.fileUrl) {
					const { width, height } = sizeOf(image.buffer)
					uploadedImages.push({
						src: postImageRes.fileUrl,
						alt: image.originalname,
						width: width || 500,
						height: height || 500
					})
				}
			}
		}

		return await this.postRepository.create({ userProfileId, title, content, links, tags, images: uploadedImages })
	}

	public async findAllPosts({ page, quantity, userProfileId }: { page: number; quantity: number; userProfileId?: string; }) {
		return await this.postRepository.findAll({ page, quantity, userProfileId })
	}

	public async findPostById({ postId: id }: { postId: string; }) {
		return await this.postRepository.findById({ id }) ?? 'POST_NOT_FOUND'
	}

	public async deletePost({
		userProfileId, postId: id
	}: { userProfileId: string; postId: string; }) {
		const post = await this.postRepository.findById({ id })
		if (!post) return 'POST_NOT_FOUND'
		if (post.authorId !== userProfileId) return 'THIS_POST_BELONG_TO_ANOTHER_USER'
		return await this.postRepository.delete({ id })
	}
}

import { SUPPORTED_IMAGES, MAX_SIZE } from '@constants'
import { injectable, singleton } from 'tsyringe'
import { PostRepository } from '@repository'
import { ImageInput } from 'image'
import { PostInput } from 'post'
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
	}: PostInput) {
		if (
			!title &&
			!content &&
			(!links || links.length === 0) &&
			(!tags || tags.length === 0) &&
			(!images || images.length === 0)
		) return 'COMPLETELY_EMPTY_POST'

		const uploadedImages: ImageInput[] = []

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

	public async updatePost({
		userProfileId, postId, title, content, links, tags, images
	}: PostInput & { postId: string; }) {
		const postExists = await this.postRepository.findById({ id: postId })
		if (!postExists) return 'POST_NOT_FOUND'
		else if (postExists.authorId !== userProfileId) return 'YOU_ARE_NOT_THE_AUTHOR'

		const uploadedImages: ImageInput[] = []

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

		return await this.postRepository.update({ postId, title, content, links, tags, images: uploadedImages })
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

import { SUPPORTED_IMAGES, MAX_SIZE } from '@constants'
import { injectable, singleton } from 'tsyringe'
import { PostRepository } from '@repository'
import { ImageInput } from 'image'
import { PostInput } from 'post'
import { S3Service } from './s3Service'
import { env } from '@config'
import sizeOf from 'image-size'
import { z } from 'zod'

@injectable()
@singleton()
export class PostService {
	constructor(
        private postRepository: PostRepository,
				private s3Service: S3Service
	) {}

	public async createPost({
		userProfileId, title, content, links, tags, images, event
	}: PostInput) {
		if (
			!title &&
			!content &&
			!event &&
			(!links || links.length === 0) &&
			(!tags || tags.length === 0) &&
			(!images || images.length === 0)
		) return 'COMPLETELY_EMPTY_POST'

		const linksSchema = z.undefined().or(z.array(z.string().url()))
		const tagsSchema = z.undefined().or(z.array(z.string()))
		const eventSubjectSchema = z
			.undefined().or(
				z
					.string()
					.regex(/^[^{}]{3,70}$/, 'INVALID_EVENT_SUBJECT')
			)

		const eventDescriptionSchema = z
			.undefined().or (
				z
					.string()
					.regex(/^[^{}]{3,70}$/, 'INVALID_EVENT_DESCRIPTION')
			)

		if (links && links.length > 5) return 'TOO_MANY_LINKS'
		else if (tags && tags.length > 10) return 'TOO_MANY_TAGS'
		else if (images && images.length > 8) return 'TOO_MANY_IMAGES'
		else if (!linksSchema.safeParse(links).success) return 'INVALID_LINKS'
		else if (!tagsSchema.safeParse(tags).success) return 'INVALID_TAGS'
		else if (event && !eventSubjectSchema.safeParse(event.subject)) return 'INVALID_EVENT_SUBJECT'
		else if (event && !eventDescriptionSchema.safeParse(event.description)) return 'INVALID_EVENT_DESCRIPTION'

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

		return await this.postRepository.create({ userProfileId, title, content, links, tags, images: uploadedImages, event })
	}

	public async updatePost({
		userProfileId, postId, title, content, links, tags, images, event
	}: PostInput & { postId: string; }) {
		const postExists = await this.postRepository.findById({ id: postId })
		if (!postExists) return 'POST_NOT_FOUND'
		else if (postExists.authorId !== userProfileId) return 'YOU_ARE_NOT_THE_AUTHOR'

		const linksSchema = z.undefined().or(z.array(z.string().url()))
		const tagsSchema = z.undefined().or(z.array(z.string()))
		const eventSubjectSchema = z
			.undefined().or(
				z
					.string()
					.regex(/^[^{}]{3,70}$/, 'INVALID_EVENT_SUBJECT')
			)
		const eventDescriptionSchema = z
			.undefined().or (
				z
					.string()
					.regex(/^[^{}]{3,70}$/, 'INVALID_EVENT_DESCRIPTION')
			)

		if (links && links.length > 5) return 'TOO_MANY_LINKS'
		else if (tags && tags.length > 10) return 'TOO_MANY_TAGS'
		else if (images && images.length > 8) return 'TOO_MANY_IMAGES'
		else if (!linksSchema.safeParse(links).success) return 'INVALID_LINKS'
		else if (!tagsSchema.safeParse(tags).success) return 'INVALID_TAGS'
		else if (event && !eventSubjectSchema.safeParse(event.subject)) return 'INVALID_EVENT_SUBJECT'
		else if (event && !eventDescriptionSchema.safeParse(event.description)) return 'INVALID_EVENT_DESCRIPTION'

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

	public async findAllPosts({ tab, since, page, quantity, userProfileId }: {
		tab: 'following' | 'recommendations' | 'highlights';
		since: string;
		page: number;
		quantity: number;
		userProfileId?: string;
	}) {
		return await this.postRepository.findAll({ tab, since, page, quantity, userProfileId })
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

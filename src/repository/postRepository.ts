import { inject, injectable, singleton } from 'tsyringe'
import { PrismaClient } from '@prisma/client'
import { Id } from 'general'
import { PostInput } from 'src/types/post'
import { ImageInput } from 'src/types/image'

@injectable()
@singleton()
export class PostRepository {
	constructor(@inject('PostgresqlClient') private pg: PrismaClient) {}

	public async create({
		userProfileId,
		title,
		content,
		links,
		tags,
		images
	}: Omit<PostInput, 'images'> & { images: ImageInput[] }) {
		const post = await this.pg.post.create({
			data: {
				author: { connect: { id: userProfileId } },
				title,
				content,
				links: links && {
					createMany: {
						data: links.map(link => ({ url: link }))
					}
				},
				tags: tags && {
					createMany: {
						data: tags.map(tag => ({ name: tag }))
					}
				},
				images: images && {
					createMany: {
						data: images
					}
				}
			},
			include: {
				images: true,
				links: true,
				tags: true,
				_count: {
					select: {
						likes: true,
						views: true
					}
				}
			}
		})
		const count = post._count
		delete (post as any)['_count']
		return {
			...post,
			likesCount: count.likes,
			viewsCount: count.views
		}
	}

	public async update({
		postId,
		title,
		content,
		links,
		tags,
		images
	}: Omit<PostInput, 'images' | 'userProfileId'> & { postId: string; images: ImageInput[]; }) {
		const post = await this.pg.post.update({
			where: { id: postId },
			data: {
				title,
				content,
				links: links && {
					createMany: {
						data: links.map(link => ({ url: link }))
					}
				},
				tags: tags && {
					createMany: {
						data: tags.map(tag => ({ name: tag }))
					}
				},
				images: images && {
					createMany: {
						data: images
					}
				}
			},
			include: {
				images: true,
				links: true,
				tags: true,
				_count: {
					select: {
						likes: true,
						views: true
					}
				}
			}
		})
		const count = post._count
		delete (post as any)['_count']
		return {
			...post,
			likesCount: count.likes,
			viewsCount: count.views
		}
	}

	public async findAll({
		page, quantity, userProfileId: authorId
	}: { page: number; quantity: number; userProfileId?: string; }) {
		const where = { authorId }
		const [total, data] = await this.pg.$transaction([
			this.pg.post.count({
				where,
			}),
			this.pg.post.findMany({
				skip: page * quantity,
				take: quantity,
				where
			}),
		])
		const pages = Math.ceil(total / quantity)
		const nextPage = page + 1

		return {
			page,
			nextPage: nextPage >= pages ? null : nextPage,
			pages,
			total,
			data,
		}
	}

	public async findById({ id }: Id) {
		return await this.pg.post.findUnique({ where: { id } })
	}

	public async delete({ id }: Id) {
		return await this.pg.post.delete({ where: { id } })
	}
}
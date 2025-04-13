import { inject, injectable, singleton } from 'tsyringe'
import { PrismaClient } from '@prisma/client'
import { Id } from 'general'
import { PostInput } from 'src/types/post'
import { ImageInput } from 'src/types/image'
import { serializeAuthor } from '@serializers'

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
				author: { include: { user: true } },
				images: true,
				links: true,
				tags: true,
				_count: {
					select: {
						likes: true,
						views: true,
						comments: true
					}
				}
			}
		})
		const count = post._count
		delete (post as any)['_count']
		return {
			...post,
			author: serializeAuthor(post.author),
			likesCount: count.likes,
			viewsCount: count.views,
			commentsCount: count.comments
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
				author: { include: { user: true } },
				images: true,
				links: true,
				tags: true,
				_count: {
					select: {
						likes: true,
						views: true,
						comments: true
					}
				}
			}
		})
		const count = post._count
		delete (post as any)['_count']
		return {
			...post,
			author: serializeAuthor(post.author),
			likesCount: count.likes,
			viewsCount: count.views,
			commentsCount: count.comments
		}
	}

	public async findAll({
		since, page, quantity, userProfileId: authorId
	}: {
		tab: 'following' | 'recommendations' | 'highlights';
		since: string;
		page: number;
		quantity: number;
		userProfileId?: string;
	}) {
		const where = {
			authorId,
			created_at: {
				lte: new Date(since)
			}
		}
		const [total, data] = await this.pg.$transaction([
			this.pg.post.count({
				where,
			}),
			this.pg.post.findMany({
				skip: page * quantity,
				take: quantity,
				where,
				include: {
					author: { include: { user: true } },
					images: true,
					links: true,
					tags: true,
					_count: {
						select: {
							likes: true,
							views: true,
							comments: true
						}
					}
				}
			}),
		])
		const pages = Math.ceil(total / quantity)
		const nextPage = page + 1

		let posts: any[] = []

		data.map(post => {
			const count = post._count
			delete (post as any)['_count']
			posts = [
				...posts, 
				{
					...post,
					author: serializeAuthor(post.author),
					likesCount: count.likes,
					viewsCount: count.views,
					commentsCount: count.comments
				} as any
			]
		})

		return {
			page,
			nextPage: nextPage >= pages ? null : nextPage,
			pages,
			total,
			data: posts
		}
	}

	public async findById({ id }: Id) {
		const post = await this.pg.post.findUnique({
			where: { id },
			include: {
				author: { include: { user: true } },
				images: true,
				links: true,
				tags: true,
				_count: {
					select: {
						likes: true,
						views: true,
						comments: true
					}
				}
			}
		})
		if (!post) return post
		const count = post._count
		delete (post as any)['_count']
		return {
			...post,
			author: serializeAuthor(post.author),
			likesCount: count.likes,
			viewsCount: count.views,
			commentsCount: count.comments
		}
	}

	public async delete({ id }: Id) {
		return await this.pg.post.delete({ where: { id } })
	}
}
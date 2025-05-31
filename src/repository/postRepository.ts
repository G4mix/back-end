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
		images,
		event
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
				},
				event: event ? { create: event } : undefined
			},
			include: {
				author: { include: { user: true, links: true } },
				images: true,
				links: true,
				tags: true,
				event: true,
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
			isLiked: false,
			isViewed: false,
			likesCount: count.likes,
			viewsCount: count.views,
			commentsCount: count.comments
		}
	}

	public async update({
		postId,
		userProfileId,
		title,
		content,
		links,
		tags,
		images,
		event
	}: Omit<PostInput, 'images'> & { postId: string; images: ImageInput[]; }) {
		const post = await this.pg.post.update({
			where: { id: postId },
			data: {
				title,
				content,
				links: links && {
					deleteMany: { url:{ notIn: links } },
					createMany: {
						data: links.map(link => ({ url: link }))
					}
				},
				tags: tags && {
					deleteMany: { name: { notIn: tags } },
					createMany: {
						data: tags.map(tag => ({ name: tag }))
					}
				},
				images: images && {
					deleteMany: { src: { notIn: images.map(img => img.src) } },
					createMany: {
						data: images
					}
				},
				event: event ? { upsert: { create: event, update: event } } : undefined
			},
			include: {
				author: { include: { user: true, links: true } },
				images: true,
				links: true,
				tags: true,
				event: true,
				likes: {
					where: {
						postId, userProfileId
					}
				},
				views: {
					where: {
						postId, userProfileId
					}
				},
				_count: {
					select: {
						likes: true,
						views: true,
						comments: true
					}
				}
			}
		})
		const likes = post.likes
		const views = post.views
		const count = post._count
		delete (post as any)['_count']
		delete (post as any)['likes']
		delete (post as any)['views']
		return {
			...post,
			author: serializeAuthor(post.author),
			isLiked: likes.length > 0,
			isViewed: views.length > 0,
			likesCount: count.likes,
			viewsCount: count.views,
			commentsCount: count.comments
		}
	}

	public async findAll({
		since,
		page,
		quantity,
		authorId,
		userProfileId
	}: {
		tab: 'following' | 'recommendations' | 'highlights';
		since: string;
		page: number;
		quantity: number;
		authorId?: string;
		userProfileId: string;
	}) {
		const where = {
			authorId,
			created_at: {
				lte: new Date(since)
			}
		}
	
		const [total, postsData] = await this.pg.$transaction([
			this.pg.post.count({ where }),
			this.pg.post.findMany({
				skip: page * quantity,
				take: quantity,
				where,
				orderBy: { created_at: 'desc' },
				include: {
					author: { include: { user: true, links: true } },
					images: true,
					links: true,
					tags: true,
					event: true,
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
	
		const postIds = postsData.map(post => post.id)
		let userLikes: { postId: null | string }[] = []
		let userViews: { postId: string }[] = []
	
		if (userProfileId) {
			[userLikes, userViews] = await this.pg.$transaction([
				this.pg.like.findMany({
					where: {
						postId: { in: postIds },
						userProfileId
					},
					select: { postId: true }
				}),
				this.pg.view.findMany({
					where: {
						postId: { in: postIds },
						userProfileId
					},
					select: { postId: true }
				})
			])
		}
	
		const likedPostIds = new Set(userLikes.map(like => like.postId))
		const viewedPostIds = new Set(userViews.map(view => view.postId))

		const formatted = postsData.map(post => {
			const count = post._count
			delete (post as any)._count
	
			return {
				...post,
				author: serializeAuthor(post.author),
				isLiked: likedPostIds.has(post.id),
				isViewed: viewedPostIds.has(post.id),
				likesCount: count.likes,
				viewsCount: count.views,
				commentsCount: count.comments
			}
		})
	
		const pages = Math.ceil(total / quantity)
		const nextPage = page + 1
	
		return {
			page,
			nextPage: nextPage >= pages ? null : nextPage,
			pages,
			total,
			data: formatted
		}
	}	

	public async findById({ id, userProfileId }: Id & { userProfileId: string; }) {
		const post = await this.pg.post.findUnique({
			where: { id },
			include: {
				author: { include: { user: true, links: true } },
				images: true,
				links: true,
				tags: true,
				event: true,
				likes: {
					where: {
						postId: id, userProfileId
					}
				},
				views: {
					where: {
						postId: id, userProfileId
					}
				},
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
		const likes = post.likes
		const views = post.views
		const count = post._count
		delete (post as any)['_count']
		delete (post as any)['likes']
		delete (post as any)['views']
		return {
			...post,
			author: serializeAuthor(post.author),
			isLiked: likes.length > 0,
			isViewed: views.length > 0,
			likesCount: count.likes,
			viewsCount: count.views,
			commentsCount: count.comments
		}
	}

	public async delete({ id }: Id) {
		return await this.pg.post.delete({ where: { id } })
	}
}
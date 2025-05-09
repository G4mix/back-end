import { inject, injectable, singleton } from 'tsyringe'
import { PrismaClient } from '@prisma/client'
import { serializeAuthor } from '@serializers'

@injectable()
@singleton()
export class CommentRepository {
	constructor(@inject('PostgresqlClient') private pg: PrismaClient) {}
	public async create({
		postId, commentId, userProfileId, content
	}: { postId: string; commentId?: string; userProfileId: string; content: string; }) {
		const comment = await this.pg.comment.create({
			data: { postId, parentCommentId: commentId, authorId: userProfileId, content },
			include: {
				author: { include: { user: true } },
				replies: {
					take: 2,
					orderBy: {
						created_at: 'desc'
					},
					include: {
						author: { include: { user: true } },
						_count: {
							select: {
								likes: true
							}
						}
					}
				},
				_count: {
					select: {
						likes: true,
						replies: true
					}
				}
			}
		})
		const count = comment._count
		delete (comment as any)['_count']

		const replies = comment.replies.map(reply => {
			const replyCount = reply._count
			delete (reply as any)['_count']
			return {
				...reply,
				author: serializeAuthor(reply.author),
				likesCount: replyCount.likes
			}
		})		

		return {
			...comment,
			replies,
			author: serializeAuthor(comment.author),
			likesCount: count.likes,
			repliesCount: count.replies
		}
	}

	public async findCommentById({
		commentId
	}: { commentId: string; }) {
		const comment = await this.pg.comment.findUnique({
			where: { id: commentId },
			include: {
				author: { include: { user: true } },
				_count: {
					select: {
						likes: true
					}
				}
			}
		})

		if (!comment) return comment;

		const count = comment._count
		delete (comment as any)['_count']

		return {
			...comment,
			author: serializeAuthor(comment.author),
			likesCount: count.likes
		}
	}

	public async findAll({
		postId, commentId, page, quantity, since
	}: { postId: string; commentId?: string; page: number; quantity: number; since: string; }) {
		const where = {
			postId,
			parentCommentId: commentId ? commentId : null,
			created_at: {
				lte: new Date(since)
			}
		}
		
		const [total, data] = await this.pg.$transaction([
			this.pg.comment.count({
				where,
			}),
			this.pg.comment.findMany({
				skip: page * quantity,
				take: quantity,
				where,
				orderBy: {
					created_at: 'desc',
				},
				include: {
					author: { include: { user: true } },
					replies: {
						take: 2,
						orderBy: {
							created_at: 'desc'
						},
						include: {
							author: { include: { user: true } },
							_count: {
								select: {
									likes: true
								}
							}
						}
					},
					_count: {
						select: {
							likes: true
						}
					}
				}
			}),
		])
		const pages = Math.ceil(total / quantity)
		const nextPage = page + 1

		let comments: any[] = []

		data.map(comment => {
			const count = comment._count
			delete (comment as any)['_count']

			const replies = comment.replies.map(reply => {
				const replyCount = reply._count
				delete (reply as any)['_count']
				return {
					...reply,
					author: serializeAuthor(reply.author),
					likesCount: replyCount.likes
				}
			})			

			comments = [
				...comments, 
				{
					...comment,
					replies,
					author: serializeAuthor(comment.author),
					likesCount: count.likes
				} as any
			]
		})

		return {
			page,
			nextPage: nextPage >= pages ? null : nextPage,
			pages,
			total,
			data: comments
		}
	}
}
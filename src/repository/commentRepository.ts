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
				author: { include: { user: true, links: true } },
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
		
		return {
			...comment,
			author: serializeAuthor(comment.author),
			isLiked: false,
			likesCount: count.likes,
			repliesCount: count.replies
		}
	}

	public async findCommentById({
		commentId,
		userProfileId
	}: { commentId: string; userProfileId: string; }) {
		const comment = await this.pg.comment.findUnique({
			where: { id: commentId },
			include: {
				author: { include: { user: true, links: true } },
				likes: {
					where: {
						commentId, userProfileId
					}
				},
				_count: {
					select: {
						likes: true
					}
				}
			}
		})

		if (!comment) return comment

		const likes = comment.likes
		const count = comment._count
		delete (comment as any)['_count']
		delete (comment as any)['likes']

		return {
			...comment,
			author: serializeAuthor(comment.author),
			isLiked: likes.length > 0,
			likesCount: count.likes
		}
	}

	public async findAll({
		postId, commentId, userProfileId, page, quantity, since
	}: {
		postId: string;
		userProfileId: string;
		commentId?: string;
		page: number;
		quantity: number;
		since: string;
	}) {
		const where = {
			postId,
			parentCommentId: commentId ? commentId : null,
			created_at: {
				lte: new Date(since)
			}
		}
	
		const [total, commentsData] = await this.pg.$transaction([
			this.pg.comment.count({ where }),
			this.pg.comment.findMany({
				skip: page * quantity,
				take: quantity,
				where,
				orderBy: { created_at: 'desc' },
				include: {
					author: { include: { user: true, links: true } },
					_count: {
						select: {
							likes: true,
							replies: true
						}
					}
				}
			}),
		])
	
		const commentIds = commentsData.map(c => c.id)
	
		const userLikes = await this.pg.like.findMany({
			where: {
				commentId: { in: commentIds },
				userProfileId
			},
			select: { commentId: true }
		})
	
		const likedCommentIds = new Set(userLikes.map(l => l.commentId))
	
		const formatted = commentsData.map(comment => {
			const count = comment._count
			delete (comment as any)._count
	
			return {
				...comment,
				author: serializeAuthor(comment.author),
				isLiked: likedCommentIds.has(comment.id),
				likesCount: count.likes,
				repliesCount: count.replies
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
}
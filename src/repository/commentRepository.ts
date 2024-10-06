import { inject, injectable, singleton } from 'tsyringe'
import { PrismaClient } from '@prisma/client'

@injectable()
@singleton()
export class CommentRepository {
	constructor(@inject('PostgresqlClient') private pg: PrismaClient) {}
	public async create({
		postId, commentId, userProfileId, content
	}: { postId?: string; commentId?: string; userProfileId: string; content: string; }) {
		return await this.pg.comment.create({
			data: { postId, parentCommentId: commentId, userProfileId, content }
		})
	}
	public async findAll({
		postId, commentId, page, quantity
	}: { postId?: string; commentId?: string; page: number; quantity: number; }) {
		const where = { postId, parentCommentId: commentId }

		const [total, data] = await this.pg.$transaction([
			this.pg.comment.count({
				where,
			}),
			this.pg.comment.findMany({
				skip: page * quantity,
				take: quantity,
				where,
				include: {
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
			comments = [
				...comments, 
				{
					...comment,
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
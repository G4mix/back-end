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
			data: { postId, commentId, userProfileId, content }
		})
	}
}
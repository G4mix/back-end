import { inject, injectable, singleton } from 'tsyringe'
import { PrismaClient } from '@prisma/client'
import { Id } from 'general'

@injectable()
@singleton()
export class LikeRepository {
	constructor(@inject('PostgresqlClient') private pg: PrismaClient) {}

	public async userHasLikedPost({
		postId, userProfileId
	}: { postId: string; userProfileId: string; }) {
		return await this.pg.like.findUnique({
			where: { userProfileId_postId: { postId, userProfileId } }
		})
	}

	public async userHasLikedComment({
		commentId, userProfileId
	}: { commentId: string; userProfileId: string; }) {
		return await this.pg.like.findUnique({
			where: { userProfileId_commentId: { commentId, userProfileId } }
		})
	}

	public async create({
		postId, commentId, userProfileId
	}: { postId?: string; commentId?: string; userProfileId: string; }) {
		return await this.pg.like.create({
			data: { postId, commentId, userProfileId }
		})
	}

	public async delete({ id }: Id) {
		return await this.pg.like.delete({
			where: { id }
		})
	}
}
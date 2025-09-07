import { inject, injectable, singleton } from 'tsyringe'
import { PrismaClient } from '@prisma/client'
import { Id } from '@shared/types'

@injectable()
@singleton()
export class LikeRepository {
	constructor(@inject('PostgresqlClient') private pg: PrismaClient) {}

	public async userHasLikedIdea({
		ideaId, userProfileId
	}: { ideaId: string; userProfileId: string; }) {
		return await this.pg.like.findUnique({
			where: { userProfileId_ideaId: { ideaId, userProfileId } }
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
		ideaId, commentId, userProfileId
	}: { ideaId?: string; commentId?: string; userProfileId: string; }) {
		return await this.pg.like.create({
			data: { ideaId, commentId, userProfileId }
		})
	}

	public async delete({ id }: Id) {
		return await this.pg.like.delete({
			where: { id }
		})
	}
}
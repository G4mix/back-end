import { inject, injectable, singleton } from 'tsyringe'
import { PrismaClient } from '@prisma/client'
import { Id } from '@shared/types/general'

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

	public async getLikeCount({
		ideaId, commentId
	}: { ideaId?: string; commentId?: string; }) {
		const where: any = {}
		if (ideaId) where.ideaId = ideaId
		if (commentId) where.commentId = commentId

		return await this.pg.like.count({ where })
	}

	public async findByUserAndContent({
		ideaId, commentId, userProfileId
	}: { ideaId?: string; commentId?: string; userProfileId: string; }) {
		const where: any = { userProfileId }
		if (ideaId) where.ideaId = ideaId
		if (commentId) where.commentId = commentId

		return await this.pg.like.findFirst({ where })
	}

	public async deleteByUserAndContent({
		ideaId, commentId, userProfileId
	}: { ideaId?: string; commentId?: string; userProfileId: string; }) {
		const where: any = { userProfileId }
		if (ideaId) where.ideaId = ideaId
		if (commentId) where.commentId = commentId

		return await this.pg.like.deleteMany({ where })
	}
}
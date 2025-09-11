import { inject, injectable, singleton } from 'tsyringe'
import { PrismaClient } from '@prisma/client'
import { Id } from '@shared/types/general'

@injectable()
@singleton()
export class LinkRepository {
	constructor(@inject('PostgresqlClient') private pg: PrismaClient) {}

	public async create({
		url, userProfileId, ideaId
	}: { url: string; userProfileId?: string; ideaId?: string; }) {
		return await this.pg.link.create({
			data: { url, userProfileId, ideaId }
		})
	}

	public async delete({ id }: Id) {
		return await this.pg.link.delete({
			where: { id }
		})
	}

	public async findByUser({ userProfileId }: { userProfileId: string; }) {
		return await this.pg.link.findMany({
			where: { userProfileId },
			orderBy: { id: 'desc' }
		})
	}

	public async findByIdea({ ideaId }: { ideaId: string; }) {
		return await this.pg.link.findMany({
			where: { ideaId },
			orderBy: { id: 'desc' }
		})
	}

	public async findByUserAndId({
		linkId, userProfileId
	}: { linkId: string; userProfileId: string; }) {
		return await this.pg.link.findFirst({
			where: { 
				id: linkId,
				userProfileId 
			}
		})
	}

	public async findById({ id }: Id) {
		return await this.pg.link.findUnique({
			where: { id }
		})
	}
}

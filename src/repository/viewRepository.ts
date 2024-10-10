import { inject, injectable, singleton } from 'tsyringe'
import { PrismaClient } from '@prisma/client'

@injectable()
@singleton()
export class ViewRepository {
	constructor(@inject('PostgresqlClient') private pg: PrismaClient) {}
	public async create({
		userProfileId, postId
	}: { userProfileId: string; postId: string; }) {
		return await this.pg.view.create({ data: { userProfileId, postId } })
	}

	public async existsByPostIdAndUserProfileUserId({
		userProfileId, postId
	}: { userProfileId: string; postId: string; }) {
		return await this.pg.view.findUnique({
			where: { userProfileId_postId: { userProfileId, postId } }
		})
	}
}
import { inject, injectable, singleton } from 'tsyringe'
import { PrismaClient } from '@prisma/client'

@injectable()
@singleton()
export class ViewRepository {
	constructor(@inject('PostgresqlClient') private pg: PrismaClient) {}
	public async createMany({
		userProfileId, ideas
	}: { userProfileId: string; ideas: string[]; }) {
		await this.pg.view.createMany({
			skipDuplicates: true,
			data: ideas.map((ideaId) => ({ userProfileId, ideaId }))
		})
	}
}
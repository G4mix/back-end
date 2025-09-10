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

	public async create({
		userProfileId, ideaId
	}: { userProfileId: string; ideaId: string; }) {
		return await this.pg.view.create({
			data: { userProfileId, ideaId }
		})
	}

	public async findByUserAndIdea({
		userProfileId, ideaId
	}: { userProfileId: string; ideaId: string; }) {
		return await this.pg.view.findUnique({
			where: { 
				userProfileId_ideaId: { 
					userProfileId, 
					ideaId 
				} 
			}
		})
	}

	public async getCount({ ideaId }: { ideaId: string; }) {
		return await this.pg.view.count({
			where: { ideaId }
		})
	}

	public async preventDuplicates({
		userProfileId, ideaId
	}: { userProfileId: string; ideaId: string; }) {
		const existingView = await this.findByUserAndIdea({ userProfileId, ideaId })
		return !existingView // Returns true if no duplicate exists
	}
}
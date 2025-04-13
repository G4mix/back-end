import { inject, injectable, singleton } from 'tsyringe'
import { PrismaClient } from '@prisma/client'

@injectable()
@singleton()
export class ViewRepository {
	constructor(@inject('PostgresqlClient') private pg: PrismaClient) {}
	public async createMany({
		userProfileId, posts
	}: { userProfileId: string; posts: string[]; }) {
		await this.pg.view.createMany({
			skipDuplicates: true,
			data: posts.map((postId) => ({ userProfileId, postId }))
		})
	}
}
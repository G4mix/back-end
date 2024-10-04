import { inject, injectable, singleton } from 'tsyringe'
import { PrismaClient } from '@prisma/client'
import { Id } from 'general'

@injectable()
@singleton()
export class PostRepository {
	constructor(@inject('PostgresqlClient') private pg: PrismaClient) {}

	public async findAll({
		page, quantity, userProfileId: authorId
	}: { page: number; quantity: number; userProfileId?: string; }) {
		const where = { authorId }
		const [total, data] = await this.pg.$transaction([
			this.pg.post.count({
				where,
			}),
			this.pg.post.findMany({
				skip: page * quantity,
				take: quantity,
				where
			}),
		])
		const pages = Math.ceil(total / quantity)
		const nextPage = page + 1

		return {
			page,
			nextPage: nextPage >= pages ? null : nextPage,
			pages,
			total,
			data,
		}
	}

	public async findById({ id }: Id) {
		return await this.pg.post.findUnique({ where: { id } })
	}

	public async delete({ id }: Id) {
		return await this.pg.post.delete({ where: { id } })
	}
}
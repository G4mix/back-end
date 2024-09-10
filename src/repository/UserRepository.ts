import { inject, injectable, singleton } from 'tsyringe'
import { PrismaClient } from '@prisma/client'
import { AuthInput, UpdateInput } from 'auth'
import { Id } from 'general'

@injectable()
@singleton()
export class UserRepository {
	constructor(@inject('PostgresqlClient') private pg: PrismaClient) {}

	public async findById({ id }: Id) {
		return await this.pg.user.findUnique({
			where: { id }
		})
	}

	public async findByEmail({ email }: { email: string; }) {
		return await this.pg.user.findUnique({
			where: { email },
			include: { userProfile: true }
		})
	}

	public async update({ id, ...data }: Partial<UpdateInput>) {
		return await this.pg.user.update({
			where: { id },
			data,
			include: { userProfile: true }
		})
	}

	public async create({ email, password, username }: AuthInput) {
		return await this.pg.user.create({
			data: {
				email,
				password,
				username,
				userProfile: {
					create: {}
				}
			},
			include: { userProfile: true }
		})
	}

	public async delete({ id }: Id) {
		return await this.pg.user.delete({
			where: { id }
		})
	}
}
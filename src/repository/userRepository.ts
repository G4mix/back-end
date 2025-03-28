import { inject, injectable, singleton } from 'tsyringe'
import { PrismaClient } from '@prisma/client'
import { AuthInput, UpdateInput } from 'auth'
import { Id } from 'general'

@injectable()
@singleton()
export class UserRepository {
	constructor(@inject('PostgresqlClient') private pg: PrismaClient) { }

	public async findById({ id }: Id) {
		return this.pg.user.findUnique({
			where: { id }
		})
	}

	public async count({ email }: { email: string; }) {
		return this.pg.user.count({
			where: { email }
		})
	}

	public async findByEmail({ email }: { email: string; }) {
		return this.pg.user.findUnique({
			where: { email },
			include: { userProfile: true }
		})
	}

	public async update({ id, icon, token, ...data }: Partial<UpdateInput> & { token?: string; }) {
		return this.pg.user.update({
			where: { id },
			data: {
				...data,
				userProfile: typeof icon === 'string' ? { update: { data: { icon } } } : undefined,
				refreshToken: typeof token === 'string' ? { upsert: { create: { token }, update: { token } } } : undefined
			},
			include: { userProfile: true }
		})
	}

	public async create({ email, password, username }: AuthInput) {
		return this.pg.user.create({
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
		return this.pg.user.delete({
			where: { id }
		})
	}

	async findOAuthUser({ provider, email }: { provider: string; email: string }) {
		return this.pg.userOAuth.findUnique({
			where: {
				provider_email: { provider, email },
			},
			include: {
				user: { include: { userProfile: true } }
			}
		})
	}

	async linkOAuthProvider({ userId, provider, email }: { userId: string; provider: string; email: string }) {
		return this.pg.userOAuth.create({
			data: {
				user: { connect: { id: userId } },
				provider,
				email
			},
			include: {
				user: { include: { userProfile: true } }
			}
		})
	}
}
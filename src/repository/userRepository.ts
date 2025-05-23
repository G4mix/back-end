import { inject, injectable, singleton } from 'tsyringe'
import { PrismaClient } from '@prisma/client'
import { AuthInput, UpdateInput } from 'auth'
import { Id } from 'general'
import { serializeUser } from '@serializers'
import { generateRandomCode } from '@utils'

@injectable()
@singleton()
export class UserRepository {
	constructor(@inject('PostgresqlClient') private pg: PrismaClient) { }

	public async findAll({ userId, search, page, quantity }: { search: string; userId: string; page: number; quantity: number; }) {
		const where = {
			id: {
				not: userId,
			},
			OR: [
				{
					username: {
						contains: search
					},
				},
				{
					userProfile: {
						displayName: {
							contains: search
						}
					}
				},
			]
		}

		const [total, data] = await this.pg.$transaction([
			this.pg.user.count({
				where,
			}),
			this.pg.user.findMany({
				skip: page * quantity,
				take: quantity,
				where,
				orderBy: {
					username: 'desc',
				},
				include: {
					userProfile: true,
				}
			}),
		])
		const pages = Math.ceil(total / quantity)
		const nextPage = page + 1
		
		let users: any[] = []
		
		data.map(user => {
			users = [
				...users,
				serializeUser(user)
			]
		})
		
		return {
			page,
			nextPage: nextPage >= pages ? null : nextPage,
			pages,
			total,
			data: users
		}
	}

	public async findById({ id }: Id) {
		return this.pg.user.findUnique({
			where: { id },
			include: {
				userProfile: true,
				userCode: true
			}
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
			include: {
				userProfile: true,
				userCode: true
			}
		})
	}

	public async update({ id, icon, token, code, ...data }: Partial<UpdateInput> & { token?: string; }) {
		return this.pg.user.update({
			where: { id },
			data: {
				...data,
				userProfile: typeof icon === 'string' ? { update: { data: { icon } } } : undefined,
				userCode: typeof code === 'string' ? { update: { where: { user: { id } }, data: { code } } } : undefined,
				refreshToken: typeof token === 'string' ? { upsert: { create: { token }, update: { token } } } : undefined
			},
			include: { userProfile: true, userCode: true }
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
				},
				userCode: {
					create: {
						code: generateRandomCode()
					}
				}
			},
			include: { userProfile: true, userCode: true }
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
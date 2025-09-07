import { inject, injectable, singleton } from 'tsyringe'
import { Prisma, PrismaClient } from '@prisma/client'
import { AuthInput, UpdateInput } from '@shared/types'
import { Id } from '@shared/types'
import { serializeUser, UserWithProfile } from '@shared/utils/serializers'
import { generateRandomCode } from '@shared/utils'

@injectable()
@singleton()
export class UserRepository {
	constructor(@inject('PostgresqlClient') private pg: PrismaClient) {}

	public async findAll({
		userId,
		search,
		page,
		quantity,
	}: {
    search: string
    userId: string
    page: number
    quantity: number
  }) {
		const where = {
			id: {
				not: userId,
			},
			OR: [
				{
					username: {
						contains: search,
						mode: Prisma.QueryMode.insensitive,
					},
				},
				{
					userProfile: {
						displayName: {
							contains: search,
							mode: Prisma.QueryMode.insensitive,
						},
					},
				},
			],
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
					userProfile: {
						include: {
							links: true,
							_count: {
								select: {
									following: true,
									followers: true,
								},
							},
						},
					},
				},
			}),
		])
		const pages = Math.ceil(total / quantity)
		const nextPage = page + 1

		let users: any[] = []

		data.map((user) => {
			users = [...users, serializeUser(user)]
		})

		return {
			page,
			nextPage: nextPage >= pages ? null : nextPage,
			pages,
			total,
			data: users,
		}
	}

	public async findByUserProfileId({ id, userId }: Id & { userId: string }) {
		const data = await this.pg.user.findUnique({
			where: { userProfileId: id },
			include: {
				userProfile: {
					include: {
						links: true,
						followers: userId !== id && {
							where: {
								followerUserId: userId,
								followingUserId: id,
							},
						},
						_count: {
							select: {
								following: true,
								followers: true,
							},
						},
					},
				},
				userCode: true,
			},
		})
		if (!data) return data
		const user: UserWithProfile = data
		if (data.userProfile.followers) {
			user.userProfile.isFollowing = data.userProfile.followers.length !== 0
			delete (user.userProfile as any).followers
		}
		return user
	}

	public async findById({ id }: Id) {
		return this.pg.user.findUnique({
			where: { id },
			include: {
				userProfile: {
					include: {
						links: true,
						_count: {
							select: {
								following: true,
								followers: true,
							},
						},
					},
				},
				userCode: true,
			},
		})
	}

	public async count({ email }: { email: string }) {
		return this.pg.user.count({
			where: { email },
		})
	}

	public async findByEmail({ email }: { email: string }) {
		return this.pg.user.findUnique({
			where: { email },
			include: {
				userProfile: {
					include: {
						links: true,
						_count: {
							select: {
								following: true,
								followers: true,
							},
						},
					},
				},
				userCode: true,
			},
		})
	}

	public async update({
		id,
		icon,
		backgroundImage,
		autobiography,
		displayName,
		links,
		token,
		code,
		...data
	}: Partial<UpdateInput> & { token?: string }) {
		return this.pg.user.update({
			where: { id },
			data: {
				...data,
				userProfile: {
					update: {
						data: {
							autobiography,
							displayName,
							icon: typeof icon === 'string' ? icon : undefined,
							backgroundImage:
								typeof backgroundImage === 'string'
									? backgroundImage
									: undefined,
							links: links
								? {
									deleteMany: {},
									createMany: {
										data: links.map((url) => ({ url })),
										skipDuplicates: true,
									},
								}
								: undefined,
						},
					},
				},
				userCode:
					typeof code === 'string'
						? { update: { where: { user: { id } }, data: { code } } }
						: undefined,
				refreshToken:
					typeof token === 'string'
						? { upsert: { create: { token }, update: { token } } }
						: undefined,
			},
			include: {
				userProfile: {
					include: {
						links: true,
						_count: {
							select: {
								following: true,
								followers: true,
							},
						},
					},
				},
				userCode: true,
			},
		})
	}

	public async create({ email, password, username }: AuthInput) {
		return this.pg.user.create({
			data: {
				email,
				password,
				username,
				userProfile: {
					create: {},
				},
				userCode: {
					create: {
						code: generateRandomCode(),
					},
				},
			},
			include: {
				userProfile: {
					include: {
						links: true,
						_count: {
							select: {
								following: true,
								followers: true,
							},
						},
					},
				},
				userCode: true,
			},
		})
	}

	public async delete({ id }: Id) {
		return this.pg.user.delete({
			where: { id },
		})
	}

	async findOAuthUser({
		provider,
		email,
	}: {
    provider: string
    email: string
  }) {
		return this.pg.userOAuth.findUnique({
			where: {
				provider_email: { provider, email },
			},
			include: {
				user: {
					include: {
						userProfile: {
							include: {
								links: true,
								_count: {
									select: {
										following: true,
										followers: true,
									},
								},
							},
						},
					},
				},
			},
		})
	}

	async linkOAuthProvider({
		userId,
		provider,
		email,
	}: {
    userId: string
    provider: string
    email: string
  }) {
		return this.pg.userOAuth.create({
			data: {
				user: { connect: { id: userId } },
				provider,
				email,
			},
			include: {
				user: { include: { userProfile: { include: { links: true } } } },
			},
		})
	}
}

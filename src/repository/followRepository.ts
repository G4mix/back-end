import { inject, injectable, singleton } from 'tsyringe'
import { PrismaClient } from '@prisma/client'
import { serializeUser } from '@serializers'

@injectable()
@singleton()
export class FollowRepository {
	constructor(@inject('PostgresqlClient') private pg: PrismaClient) { }
	public async follow({
		followerUserId,
		followingUserId,
		followingTeamId,
	}: {
		followerUserId: string;
		followingUserId?: string;
		followingTeamId?: string;
	}) {
		if ((!followingUserId && !followingTeamId) || (followingUserId && followingTeamId)) {
			return 'YOU_CANT_FOLLOW_BOTH_OR_NONE'
		}

		if (followingUserId && followingUserId === followerUserId) {
			return 'YOU_CANT_FOLLOW_YOURSELF'
		}

		const alreadyExists = await this.pg.follow.findFirst({
			where: {
				followerUserId,
				...(followingUserId
					? { followingUserId }
					: { followingTeamId }),
			}
		})

		if (alreadyExists) {
			return 'ALREADY_FOLLOWING'
		}

		const follow = await this.pg.follow.create({
			data: {
				followerUserId,
				followingUserId,
				followingTeamId
			}
		})

		return follow
	}

	public async unfollow({
		followerUserId,
		followingUserId,
		followingTeamId,
	}: {
		followerUserId: string;
		followingUserId?: string;
		followingTeamId?: string;
	}) {
		if ((!followingUserId && !followingTeamId) || (followingUserId && followingTeamId)) {
			return 'YOU_MUST_UNFOLLOW_EITHER_USER_OR_TEAM'
		}

		if (followingUserId && followingUserId === followerUserId) {
			return 'YOU_CANT_UNFOLLOW_YOURSELF'
		}

		const where = followingUserId
			? { followerUserId_followingUserId: { followerUserId, followingUserId } }
			: { followerUserId_followingTeamId: { followerUserId, followingTeamId: followingTeamId! } }

		try {
			return await this.pg.follow.delete({ where })
		} catch (error) {
			return 'FOLLOW_NOT_FOUND'
		}
	}
	public async findAll({
		page,
		quantity,
		userId,
		followType,
		targetId
	}: {
		followType: 'followers:user' | 'followers:team' | 'following';
		userId?: string;
		targetId?: string;
		page: number;
		quantity: number;
	}) {
		const skip = page * quantity
		let whereClause: any = {}
		let includeClause: any
		let resultTransformer: any

		const userInclude = {
			userProfile: {
				include: {
					links: true,
					_count: {
						select: {
							following: true,
							followers: true
						}
					}
				}
			}
		}

		const followTypes = {
			'followers:user': () => {
				whereClause = { followingUserId: targetId }
				includeClause = {
					followerUser: {
						include: userInclude
					}
				}
				resultTransformer = (follow: any) => serializeUser(follow.followerUser)
			},
			'followers:team': () => {
				whereClause = { followingTeamId: targetId }
				includeClause = {
					followerUser: {
						include: userInclude
					}
				}
				resultTransformer = (follow: any) => serializeUser(follow.followerUser)
			},
			'following': () => {
				if (!userId) return []
				whereClause = { followerUserId: userId }
				includeClause = {
					followingUser: {
						include: userInclude
					},
					followingTeam: true
				}
				resultTransformer = (follow: any) => {
					if (follow.followingUser) {
						return serializeUser(follow.followingUser)
					}
					if (follow.followingTeam) {
						return {
							id: follow.followingTeam.id,
							name: follow.followingTeam.name
						}
					}
					return null
				}
				return
			}
		}

		const executeFollowType = followTypes[followType]
		if (!executeFollowType) return []

		const res = executeFollowType()
		if (Array.isArray(res)) return res

		const [total, follows] = await this.pg.$transaction([
			this.pg.follow.count({ where: whereClause }),
			this.pg.follow.findMany({
				skip,
				take: quantity,
				where: whereClause,
				include: includeClause
			})
		])

		const pages = Math.ceil(total / quantity)
		const nextPage = page + 1

		const data = follows
			.map(resultTransformer)
			.filter(Boolean)

		return {
			page,
			nextPage: nextPage >= pages ? null : nextPage,
			pages,
			total,
			data
		}
	}
}

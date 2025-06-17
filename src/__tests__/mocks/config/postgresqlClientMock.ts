import { Prisma, User, UserProfile, UserOAuth } from "@prisma/client"
import { DefaultArgs } from "@prisma/client/runtime/library";
import { randomUUID } from "crypto"

type Where = { email?: string; id?: string; }
export type UserWithUserProfile = User & { userProfile: UserProfile; }
export type UserOAuthWithUser = UserOAuth & { user: UserWithUserProfile; }

export class PostgresqlClientMock {
	public users: UserWithUserProfile[] = []
	public userOAuths: UserOAuthWithUser[] = []
	public rawUndefined: boolean = false //ngm usa essa merda
	
	public get user(): Prisma.UserDelegate<DefaultArgs> {
		return {
			count: async () => this.users.length,
			findFirst: async () => this.users[0],
			delete: async ({ where }: { where: Where }) => {
				this.users = this.users.filter(user => user.id !== where.id)
			},
			findMany: async (): Promise<Partial<User>[]> => {
				return this.users
			},
			findUnique: async ({ where }: { where: Where; }): Promise<User | null> => {
				const { data } = this.findUniqueUser({ where })
				if (!data) return null
				return data
			},
			update: async ({ where, data: { company, ...userData } }: { where: Where; data: Partial<UserWithUserProfile> & { company?: { connect: { id: string; }; }; } }): Promise<User | null> => {
				const { data: user } = this.findUniqueUser({ where }) || {}
				if (!user) return null
				const updatedUser = { ...user, ...userData, updated_at: new Date() }
				return { ...updatedUser } as any 
			},
			create: async ({ data }: { data: any }): Promise<UserWithUserProfile | null> => {
				const newUser: User & { userProfile: UserProfile; } = {
					id: randomUUID(),
					email: data.email,
					username: data.username,
					password: data.password,
					verified: data.verified ?? false,
					loginAttempts: data.loginAttempts ?? 0,
					blockedUntil: data.blockedUntil ?? null,
					userProfile: data.userProfile ?? { id: randomUUID(), displayName: null, icon: null, created_at: new Date(), updated_at: new Date() },
					userProfileId: data.userProfileId ?? randomUUID(),
					refreshTokenId: data.refreshTokenId ?? null,
					created_at: new Date(),
					updated_at: new Date(),
				}
				this.users.push(newUser)
				return newUser
			}
		} as any
	}

	public get userOAuth(): Prisma.UserOAuthDelegate<DefaultArgs> {
		return {
			findUnique: async ({ where }: { where: { provider_email?: { provider: string; email: string; }; }; }): Promise<UserOAuthWithUser | null> => {
				if (where.provider_email) {
					const oauthUser = this.userOAuths.find(
						oauth => oauth.provider === where.provider_email!.provider && 
						oauth.email === where.provider_email!.email
					)
					return oauthUser || null
				}
				return null
			},
			create: async ({ data }: { data: { user: { connect: { id: string; }; }; provider: string; email: string; }; }): Promise<UserOAuthWithUser> => {
				const user = this.users.find(u => u.id === data.user.connect.id)
				if (!user) throw new Error('User not found')

				const newOAuthUser: UserOAuthWithUser = {
					id: randomUUID(),
					provider: data.provider,
					email: data.email,
					userId: user.id,
					user: user,
					created_at: new Date()
				}

				this.userOAuths.push(newOAuthUser)
				return newOAuthUser
			}
		} as any
	}

	private findUniqueUser({ where }: { where: Where }): { data: User | null; index: number } {
		if (where.email) {
			const index = this.users.findIndex(user => user.email === where.email)
			return { data: index !== -1 ? this.users[index] : null, index }
		} else {
			const index = this.users.findIndex(user => user.id === where.id)
			return { data: index !== -1 ? this.users[index] : null, index }
		}
	}

	public async $transaction(actions: any[]) {
		return await Promise.all(actions.map(action => action))
	}

	public $disconnect() { }
}

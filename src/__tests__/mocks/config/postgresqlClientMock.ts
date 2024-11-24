import { Prisma, User, UserProfile } from "@prisma/client"
import { DefaultArgs } from "@prisma/client/runtime/library";
import { randomUUID } from "crypto"

type Where = { email?: string; id?: string; }
export type UserWithUserProfile = User & { userProfile: UserProfile; }

export class PostgresqlClientMock {
	public users: UserWithUserProfile[] = []
	public rawUndefined: boolean = false
	
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
			create: async ({ data }: { data: UserWithUserProfile & { company: { create?: { name: string; }; connect?: { name: string; } } } }): Promise<UserWithUserProfile | null> => {
				const newUser: User & { userProfile: UserProfile; } = {
					...data,
					id: randomUUID(),
					created_at: new Date(),
					updated_at: new Date(),
					verified: false,
					blockedUntil: null,
				}
				
				this.users.push(newUser)
				return newUser
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

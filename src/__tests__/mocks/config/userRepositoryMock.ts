import { PrismaClient, User, UserOAuth } from "@prisma/client";
import { UserRepository } from "@repository";
import { UserOAuthWithUser, UserWithUserProfile } from "./postgresqlClientMock";
import { randomUUID } from "crypto";
import { Id } from "general";
import { UpdateInput } from "auth";

export class UserRepositoryMock extends UserRepository {
    public users: User[] = []
    public userOAuths: UserOAuth[] = []

    constructor() {
        super(new PrismaClient())
    }

    public async findById({ id }: Id): Promise<User | null> {
        return this.users.find(user => user.id === id) || null
    }

    public async count({ email }: { email: string }): Promise<number> {
        return this.users.filter(user => user.email === email).length
    }

    public async update({ id, icon, token, ...data }: Partial<UpdateInput> & { token?: string }): Promise<UserWithUserProfile> {
        const userIndex = this.users.findIndex(user => user.id === id)
        if (userIndex === -1) throw new Error('User not found')

        const updatedUser = {
            ...this.users[userIndex],
            ...data
        }
        this.users[userIndex] = updatedUser

        return {
            ...updatedUser,
            userProfile: {
                id: updatedUser.userProfileId,
                created_at: updatedUser.created_at,
                updated_at: updatedUser.updated_at,
                displayName: null,
                icon: typeof icon === 'string' ? icon : null
            }
        }
    }

    public async delete({ id }: Id): Promise<User> {
        const userIndex = this.users.findIndex(user => user.id === id)
        if (userIndex === -1) throw new Error('User not found')

        const deletedUser = this.users[userIndex]
        this.users.splice(userIndex, 1)
        return deletedUser
    }

    public async findByEmail({ email }: { email: string }): Promise<UserWithUserProfile | null> {
        const user = this.users.find(user => user.email === email)
        if (!user) return null

        return {
            ...user,
            userProfile: {
                id: user.userProfileId,
                created_at: user.created_at,
                updated_at: user.updated_at,
                displayName: null,
                icon: null
            }
        }
    }

    public async findOAuthUser({ provider, email }: { provider: string; email: string; }): Promise<UserOAuthWithUser | null> {
        const oauth = this.userOAuths.find(oauth => oauth.provider === provider && oauth.email === email)
        if (!oauth) return null

        return {
            ...oauth,
            user: {
                ...this.users.find(user => user.id === oauth.userId)!,
                userProfile: {
                    id: this.users.find(user => user.id === oauth.userId)?.userProfileId!,
                    created_at: this.users.find(user => user.id === oauth.userId)?.created_at!,
                    updated_at: this.users.find(user => user.id === oauth.userId)?.updated_at!,
                    displayName: null,
                    icon: null
                }
            }
        }
    }

    public async create(userData: Partial<User>): Promise<UserWithUserProfile> {
        const newUser = {
            id: randomUUID(),
            email: userData.email ?? 'mock-email',
            username: userData.username ?? 'mock-username',
            password: userData.password ?? 'mock-password',
            verified: userData.verified ?? true,
            loginAttempts: 0,
            blockedUntil: null,
            refreshTokenId: null,
            userProfileId: randomUUID(),
            created_at: new Date(),
            updated_at: new Date()
        }

        this.users.push(newUser)
        return {
            ...newUser,
            userProfile: {
                id: newUser.userProfileId,
                created_at: newUser.created_at,
                updated_at: newUser.updated_at,
                displayName: null,
                icon: null
            }
        }
    }

    public async linkOAuthProvider(data: { userId: string; provider: string; email: string }): Promise<UserOAuthWithUser> {
        const user = this.users.find(user => user.id === data.userId)!
        const oauthLink = {
            id: randomUUID(),
            userId: data.userId,
            provider: data.provider,
            email: data.email,
            created_at: new Date()
        }

        this.userOAuths.push(oauthLink)
        return {
            ...oauthLink,
            user: {
                ...user,
                userProfile: {
                    id: user.userProfileId,
                    created_at: user.created_at,
                    updated_at: user.updated_at,
                    displayName: null,
                    icon: null
                }
            }
        }
    }
}
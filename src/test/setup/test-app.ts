import 'reflect-metadata'
import { App } from '@config/app'
import { container } from '@ioc'
import { PrismaClient } from '@prisma/client'
import { S3Client } from '@aws-sdk/client-s3'
import { SESClient } from '@aws-sdk/client-ses'
import { S3ClientOptions, SESClientOptions } from '@shared/constants/aws'
import { BCryptEncoder } from '@shared/utils/bcrypt-encoder'

// Imports de repositórios
import { UserRepository } from '@shared/repositories/user.repository'
import { IdeaRepository } from '@shared/repositories/idea.repository'
import { CommentRepository } from '@shared/repositories/comment.repository'
import { FollowRepository } from '@shared/repositories/follow.repository'
import { LikeRepository } from '@shared/repositories/like.repository'
import { ViewRepository } from '@shared/repositories/view.repository'

// Imports de gateways
import { AuthGateway } from '@shared/gateways/auth.gateway'
import { UserGateway } from '@shared/gateways/user.gateway'
import { IdeaGateway } from '@shared/gateways/idea.gateway'
import { S3Gateway } from '@shared/gateways/s3.gateway'

// Imports de utils
import { Logger } from '@shared/utils/logger'
import { RouteLister } from '@shared/utils/route-lister'

// Imports de módulos
import { AppModule } from '@shared/modules/app.module'
import { StartupModuleManager } from '@shared/modules/startup.module'

// Registra todas as dependências necessárias para os testes
export function setupTestContainer(): void {
	// Limpa o container antes de registrar
	container.clearInstances()

	// Mock do PrismaClient
	const mockPrismaClient = {
		user: {
			findMany: jest.fn(),
			findUnique: jest.fn().mockImplementation(({ where }) => {
				// Busca por ID
				if (where.id === 'user-123') {
					return Promise.resolve({
						id: 'user-123',
						userProfileId: 'profile-123',
						email: 'test@example.com',
						username: 'testuser',
						password: BCryptEncoder.encode('ValidPassword123!'),
						verified: true,
						loginAttempts: 0,
						blockedUntil: null,
						created_at: new Date(),
						updated_at: new Date(),
						userProfile: {
							id: 'profile-123',
							user_id: 'user-123',
							name: 'Test User',
							displayName: 'Test User',
							bio: 'Test bio',
							backgroundImage: null,
							created_at: new Date(),
							updated_at: new Date(),
							links: [],
							_count: {
								following: 0,
								followers: 0
							}
						},
						userCode: null
					})
				}
				// Email não encontrado (deve vir antes da busca por email)
				if (where.email === 'nonexistent@example.com' || where.email === 'test@example.com' || where.email === 'TEST@EXAMPLE.COM') {
					return Promise.resolve(null)
				}
				// Busca por email
				if (where.email === 'test@example.com') {
					return Promise.resolve({
						id: 'user-123',
						userProfileId: 'profile-123',
						email: 'test@example.com',
						username: 'testuser',
						password: BCryptEncoder.encode('ValidPassword123!'),
						verified: true,
						loginAttempts: 0,
						blockedUntil: null,
						created_at: new Date(),
						updated_at: new Date(),
						userProfile: {
							id: 'profile-123',
							user_id: 'user-123',
							name: 'Test User',
							displayName: 'Test User',
							bio: 'Test bio',
							backgroundImage: null,
							created_at: new Date(),
							updated_at: new Date(),
							links: [],
							_count: {
								following: 0,
								followers: 0
							}
						},
						userCode: null
					})
				}
				// Usuário não verificado
				if (where.email === 'unverified@example.com') {
					return Promise.resolve({
						id: 'user-456',
						userProfileId: 'profile-456',
						email: 'unverified@example.com',
						username: 'unverified',
						password: BCryptEncoder.encode('ValidPassword123!'),
						verified: false,
						loginAttempts: 0,
						blockedUntil: null,
						created_at: new Date(),
						updated_at: new Date(),
						userProfile: {
							id: 'profile-456',
							user_id: 'user-456',
							name: 'Unverified User',
							displayName: 'Unverified User',
							bio: 'Test bio',
							backgroundImage: null,
							created_at: new Date(),
							updated_at: new Date(),
							links: [],
							_count: {
								following: 0,
								followers: 0
							}
						},
						userCode: null
					})
				}
				return Promise.resolve(null)
			}),
			findFirst: jest.fn(),
			create: jest.fn().mockResolvedValue({
				id: 'user-created-123',
				userProfileId: 'profile-created-123',
				email: 'test@example.com',
				username: 'testuser',
				verified: true,
				created_at: new Date(),
				updated_at: new Date()
			}),
			update: jest.fn().mockImplementation(({ where }) => {
				// Retorna dados baseados no ID do usuário
				if (where.id === 'user-456') {
					return Promise.resolve({
						id: 'user-456',
						userProfileId: 'profile-456',
						email: 'unverified@example.com',
						username: 'unverified',
						password: BCryptEncoder.encode('ValidPassword123!'),
						verified: true, // Atualizado para true após verificação
						loginAttempts: 0,
						blockedUntil: null,
						created_at: new Date(),
						updated_at: new Date(),
						userProfile: {
							id: 'profile-456',
							user_id: 'user-456',
							name: 'Unverified User',
							displayName: 'Unverified User',
							bio: 'Test bio',
							backgroundImage: null,
							created_at: new Date(),
							updated_at: new Date(),
							links: [],
							_count: {
								following: 0,
								followers: 0
							}
						},
						userCode: null
					})
				}
				
				// Usuário padrão
				return Promise.resolve({
					id: where.id || 'user-123',
					userProfileId: 'profile-123',
					email: 'test@example.com',
					username: 'testuser',
					password: BCryptEncoder.encode('ValidPassword123!'),
					verified: true,
					loginAttempts: 0,
					blockedUntil: null,
					created_at: new Date(),
					updated_at: new Date(),
					userProfile: {
						id: 'profile-123',
						user_id: 'user-123',
						name: 'Test User',
						displayName: 'Test User',
						bio: 'Test bio',
						backgroundImage: null,
						created_at: new Date(),
						updated_at: new Date(),
						links: [],
						_count: {
							following: 0,
							followers: 0
						}
					},
					userCode: null
				})
			}),
			delete: jest.fn(),
			count: jest.fn(),
			upsert: jest.fn()
		},
		userProfile: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn().mockResolvedValue({
				id: 'profile-123',
				user_id: 'user-123',
				name: 'Test User',
				created_at: new Date(),
				updated_at: new Date()
			}),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
			upsert: jest.fn()
		},
		idea: {
			findMany: jest.fn().mockImplementation((args) => {
				// Simula diferentes cenários baseados nos parâmetros
				if (args?.where?.OR) {
					// Busca por texto (search)
					return Promise.resolve([
						{
							id: 'idea-1',
							title: 'Test Idea 1',
							description: 'Description 1',
							authorId: 'user-1',
							created_at: new Date(),
							updated_at: new Date(),
							_count: {
								likes: 10,
								comments: 5,
								views: 100
							}
						}
					])
				}
				if (args?.where?.tags?.some) {
					// Busca por tags (array)
					return Promise.resolve([
						{
							id: 'idea-1',
							title: 'Test Idea 1',
							description: 'Description 1',
							authorId: 'user-1',
							created_at: new Date(),
							updated_at: new Date(),
							_count: {
								likes: 10,
								comments: 5,
								views: 100
							}
						}
					])
				}
				if (args?.where?.authorId) {
					// Busca por autor específico
					return Promise.resolve([])
				}
				// Retorno padrão
				return Promise.resolve([
					{
						id: 'idea-1',
						title: 'Test Idea 1',
						description: 'Description 1',
						authorId: 'user-1',
						created_at: new Date(),
						updated_at: new Date(),
						_count: {
							likes: 10,
							comments: 5,
							views: 100
						}
					},
					{
						id: 'idea-2',
						title: 'Test Idea 2',
						description: 'Description 2',
						authorId: 'user-2',
						created_at: new Date(),
						updated_at: new Date(),
						_count: {
							likes: 20,
							comments: 10,
							views: 200
						}
					}
				])
			}),
			findUnique: jest.fn().mockImplementation(({ where }) => {
				// Busca por ID
				if (where.id === 'idea-1' || where.id === '123e4567-e89b-12d3-a456-426614174000') {
					return Promise.resolve({
						id: where.id === '123e4567-e89b-12d3-a456-426614174000' ? '123e4567-e89b-12d3-a456-426614174000' : 'idea-1',
						title: 'Test Idea 1',
						description: 'Description 1',
						authorId: 'profile-123', // Mudado para profile-123 para corresponder ao userProfileId
						created_at: new Date(),
						updated_at: new Date(),
						author: {
							id: 'user-123',
							userProfileId: 'profile-123',
							email: 'test@example.com',
							username: 'testuser',
							verified: true,
							created_at: new Date(),
							updated_at: new Date(),
							userProfile: {
								id: 'profile-123',
								user_id: 'user-123',
								name: 'Test User',
								displayName: 'Test User',
								bio: 'Test bio',
								backgroundImage: null,
								created_at: new Date(),
								updated_at: new Date(),
								links: [],
								_count: {
									following: 0,
									followers: 0
								}
							},
							userCode: null
						},
						_count: {
							likes: 10,
							comments: 5,
							views: 100
						}
					})
				}
				// Ideia não encontrada
				return Promise.resolve(null)
			}),
			findFirst: jest.fn(),
			create: jest.fn().mockImplementation((args) => {
				return Promise.resolve({
					id: 'idea-created-123',
					title: args.data.title,
					description: args.data.description,
					authorId: 'user-1',
					created_at: new Date(),
					updated_at: new Date(),
					author: {
						id: 'user-1',
						username: 'testuser',
						email: 'test@example.com',
						userProfile: {
							id: 'profile-1',
							name: 'Test User',
							bio: null,
							icon: null
						}
					},
					images: [],
					tags: [],
					links: [],
					_count: {
						likes: 0,
						comments: 0,
						views: 0
					}
				})
			}),
			update: jest.fn().mockImplementation(({ where, data }) => {
				// Retorna a ideia atualizada baseada no ID
				if (where.id === 'idea-1' || where.id === '123e4567-e89b-12d3-a456-426614174000') {
					return Promise.resolve({
						id: 'idea-1',
						title: data.title || 'Test Idea 1',
						description: data.description || 'Description 1',
						authorId: 'user-123',
						created_at: new Date(),
						updated_at: new Date(),
						author: {
							id: 'user-123',
							userProfileId: 'profile-123',
							email: 'test@example.com',
							username: 'testuser',
							verified: true,
							created_at: new Date(),
							updated_at: new Date(),
							userProfile: {
								id: 'profile-123',
								user_id: 'user-123',
								name: 'Test User',
								displayName: 'Test User',
								bio: 'Test bio',
								backgroundImage: null,
								created_at: new Date(),
								updated_at: new Date(),
								links: [],
								_count: {
									following: 0,
									followers: 0
								}
							},
							userCode: null
						},
						_count: {
							likes: 10,
							comments: 5,
							views: 100
						}
					})
				}
				return Promise.resolve(null)
			}),
			delete: jest.fn(),
			count: jest.fn().mockImplementation((args) => {
				// Simula contagem baseada nos parâmetros
				if (args?.where?.OR) {
					// Busca por texto (search)
					return Promise.resolve(1)
				}
				if (args?.where?.tags?.some) {
					// Busca por tags (array)
					return Promise.resolve(1)
				}
				if (args?.where?.authorId) {
					// Busca por autor específico
					return Promise.resolve(0)
				}
				return Promise.resolve(2)
			}),
			upsert: jest.fn()
		},
		comment: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
			upsert: jest.fn()
		},
		like: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
			upsert: jest.fn()
		},
		view: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
			upsert: jest.fn()
		},
		follow: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
			upsert: jest.fn()
		},
		link: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
			upsert: jest.fn()
		},
		$transaction: jest.fn(),
		$connect: jest.fn().mockResolvedValue(undefined),
		$disconnect: jest.fn().mockResolvedValue(undefined),
		$queryRaw: jest.fn().mockResolvedValue([{ version: 'PostgreSQL 15.0' }])
	}

	// Registra dependências básicas
	container
		.register<PrismaClient>('PostgresqlClient', { useValue: mockPrismaClient as any })
		.register('SESClient', { useValue: new SESClient(SESClientOptions) })
		.register('S3Client', { useValue: new S3Client(S3ClientOptions) })

	// Registra repositórios
	container
		.register('UserRepository', { useClass: UserRepository })
		.register('IdeaRepository', { useClass: IdeaRepository })
		.register('CommentRepository', { useClass: CommentRepository })
		.register('FollowRepository', { useClass: FollowRepository })
		.register('LikeRepository', { useClass: LikeRepository })
		.register('ViewRepository', { useClass: ViewRepository })

	// Registra gateways
	container
		.register('AuthGateway', { useClass: AuthGateway })
		.register('UserGateway', { useClass: UserGateway })
		.register('SESGateway', { 
			useValue: {
				checkEmailStatus: jest.fn().mockImplementation((email: string) => {
					if (email === 'unverified@example.com') {
						return Promise.resolve({ status: 'Success' })
					}
					return Promise.resolve({ status: 'Success' })
				}),
				sendEmail: jest.fn().mockResolvedValue(undefined)
			}
		})
		.register('S3Gateway', { useClass: S3Gateway })
		.register('IdeaGateway', { useClass: IdeaGateway })

	// Registra utils
	container
		.register('Logger', { useClass: Logger })
		.register('RouteLister', { useClass: RouteLister })

	// Registra módulos
	container
		.register('StartupModuleManager', { useClass: StartupModuleManager })
		.register('AppModule', { useClass: AppModule })
}

export async function createTestApp(): Promise<App> {
	setupTestContainer()
	const app = container.resolve<App>(App)
	await app.start()
	return app
}

import 'reflect-metadata'
import { App } from '@config/app'
import { container } from 'tsyringe'
import { AppModule } from '@shared/modules/app.module'
import { Logger } from '@shared/utils/logger'
import { StartupModuleManager } from '@shared/modules/startup.module'
import { PrismaClient } from '@prisma/client'
import { S3Client } from '@aws-sdk/client-s3'
import { SESClient } from '@aws-sdk/client-ses'
import { S3ClientOptions, SESClientOptions } from '@shared/constants/aws'
import { RouteLister } from '@shared/utils/route-lister'
import { IdeaRepository } from '@shared/repositories/idea.repository'
import { UserRepository } from '@shared/repositories/user.repository'
import { FollowRepository } from '@shared/repositories/follow.repository'
import { LinkRepository } from '@shared/repositories/link.repository'
import { CommentRepository } from '@shared/repositories/comment.repository'
import { LikeRepository } from '@shared/repositories/like.repository'
import { ViewRepository } from '@shared/repositories/view.repository'
import { RecordViewController } from '@features/views/record-view/record-view.controller'
import { IdeaGateway } from '@shared/gateways/idea.gateway'
import { UserGateway } from '@shared/gateways/user.gateway'
import { S3Gateway } from '@shared/gateways/s3.gateway'
import { AuthGateway } from '@shared/gateways/auth.gateway'
import { SESGateway } from '@shared/gateways/ses.gateway'

// Mock do Prisma
jest.mock('@prisma/client', () => ({
	PrismaClient: jest.fn().mockImplementation(() => ({
		user: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
			upsert: jest.fn()
		},
		userProfile: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
			upsert: jest.fn()
		},
		idea: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
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
			upsert: jest.fn(),
			createMany: jest.fn()
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
		tag: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
			upsert: jest.fn()
		},
		image: {
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
		$connect: jest.fn(),
		$disconnect: jest.fn(),
		$queryRaw: jest.fn()
	})),
	Prisma: {
		QueryMode: {
			insensitive: 'insensitive'
		}
	}
}))

// Mock do AWS S3
jest.mock('@aws-sdk/client-s3', () => ({
	S3Client: jest.fn().mockImplementation(() => ({
		send: jest.fn()
	})),
	PutObjectCommand: jest.fn(),
	DeleteObjectCommand: jest.fn(),
	DeleteObjectsCommand: jest.fn(),
	GetObjectCommand: jest.fn()
}))

// Mock do AWS SES
jest.mock('@aws-sdk/client-ses', () => ({
	SESClient: jest.fn().mockImplementation(() => ({
		send: jest.fn()
	})),
	SendTemplatedEmailCommand: jest.fn(),
	GetIdentityVerificationAttributesCommand: jest.fn(),
	VerifyEmailIdentityCommand: jest.fn()
}))

// Mock do Logger
jest.mock('@shared/utils/logger', () => ({
	Logger: jest.fn().mockImplementation(() => ({
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
		debug: jest.fn(),
		log: jest.fn()
	}))
}))

export class IntegrationTestSetup {
	private static app: App

	/**
	 * Inicia o servidor para testes de integração
	 */
	static async startServer(): Promise<string> {
		// Limpa o container antes de registrar
		container.clearInstances()

		// Cria instâncias mockadas
		const mockPrismaClient = new PrismaClient()
		const mockS3Client = new S3Client(S3ClientOptions)
		const mockSESClient = new SESClient(SESClientOptions)

		// Configura mocks específicos do Prisma
		mockPrismaClient.$queryRaw = jest.fn()
			.mockResolvedValueOnce([{ test: 1 }]) // Para o primeiro $queryRaw (SELECT 1 as test)
			.mockResolvedValueOnce([{ // Para o segundo $queryRaw (database info)
				database_name: 'test_db',
				current_user: 'test_user',
				postgres_version: 'PostgreSQL 15.0'
			}])

		// Mock das operações do Prisma para testes
		Object.assign(mockPrismaClient, {
			user: {
			findMany: jest.fn().mockResolvedValue([]),
			findUnique: jest.fn().mockResolvedValue(null),
			findFirst: jest.fn().mockResolvedValue(null),
			create: jest.fn().mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'test@example.com',
				username: 'testuser',
				verified: true,
				created_at: new Date(),
				updated_at: new Date()
			}),
			update: jest.fn().mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'test@example.com',
				username: 'testuser',
				verified: true,
				created_at: new Date(),
				updated_at: new Date()
			}),
			delete: jest.fn().mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'test@example.com',
				username: 'testuser',
				verified: true,
				created_at: new Date(),
				updated_at: new Date()
			}),
			count: jest.fn().mockResolvedValue(0),
			upsert: jest.fn().mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'test@example.com',
				username: 'testuser',
				verified: true,
				created_at: new Date(),
				updated_at: new Date()
			})
		},
			idea: {
			findMany: jest.fn().mockResolvedValue([]),
			findUnique: jest.fn().mockResolvedValue(null),
			findFirst: jest.fn().mockResolvedValue(null),
			create: jest.fn().mockResolvedValue({
				id: 'idea-123',
				title: 'Test Idea',
				description: 'Test Description',
				authorId: 'user-123',
				created_at: new Date(),
				updated_at: new Date()
			}),
			update: jest.fn().mockResolvedValue({
				id: 'idea-123',
				title: 'Test Idea',
				description: 'Test Description',
				authorId: 'user-123',
				created_at: new Date(),
				updated_at: new Date()
			}),
			delete: jest.fn().mockResolvedValue({
				id: 'idea-123',
				title: 'Test Idea',
				description: 'Test Description',
				authorId: 'user-123',
				created_at: new Date(),
				updated_at: new Date()
			}),
			count: jest.fn().mockResolvedValue(0),
			upsert: jest.fn().mockResolvedValue({
				id: 'idea-123',
				title: 'Test Idea',
				description: 'Test Description',
				authorId: 'user-123',
				created_at: new Date(),
				updated_at: new Date()
			})
		},
			userProfile: {
			findMany: jest.fn().mockResolvedValue([]),
			findUnique: jest.fn().mockResolvedValue(null),
			findFirst: jest.fn().mockResolvedValue(null),
			create: jest.fn().mockResolvedValue({
				id: 'profile-123',
				user_id: 'user-123',
				name: 'Test User',
				created_at: new Date(),
				updated_at: new Date()
			}),
			update: jest.fn().mockResolvedValue({
				id: 'profile-123',
				user_id: 'user-123',
				name: 'Test User',
				created_at: new Date(),
				updated_at: new Date()
			}),
			delete: jest.fn().mockResolvedValue({
				id: 'profile-123',
				user_id: 'user-123',
				name: 'Test User',
				created_at: new Date(),
				updated_at: new Date()
			}),
			count: jest.fn().mockResolvedValue(0),
			upsert: jest.fn().mockResolvedValue({
				id: 'profile-123',
				user_id: 'user-123',
				name: 'Test User',
				created_at: new Date(),
				updated_at: new Date()
			})
		},
			comment: {
			findMany: jest.fn().mockResolvedValue([]),
			findUnique: jest.fn().mockResolvedValue(null),
			findFirst: jest.fn().mockResolvedValue(null),
			create: jest.fn().mockResolvedValue({
				id: 'comment-123',
				content: 'Test Comment',
				authorId: 'user-123',
				ideaId: 'idea-123',
				created_at: new Date(),
				updated_at: new Date()
			}),
			update: jest.fn().mockResolvedValue({
				id: 'comment-123',
				content: 'Test Comment',
				authorId: 'user-123',
				ideaId: 'idea-123',
				created_at: new Date(),
				updated_at: new Date()
			}),
			delete: jest.fn().mockResolvedValue({
				id: 'comment-123',
				content: 'Test Comment',
				authorId: 'user-123',
				ideaId: 'idea-123',
				created_at: new Date(),
				updated_at: new Date()
			}),
			count: jest.fn().mockResolvedValue(0),
			upsert: jest.fn().mockResolvedValue({
				id: 'comment-123',
				content: 'Test Comment',
				authorId: 'user-123',
				ideaId: 'idea-123',
				created_at: new Date(),
				updated_at: new Date()
			})
		},
			like: {
			findMany: jest.fn().mockResolvedValue([]),
			findUnique: jest.fn().mockResolvedValue(null),
			findFirst: jest.fn().mockResolvedValue(null),
			create: jest.fn().mockResolvedValue({
				id: 'like-123',
				userId: 'user-123',
				ideaId: 'idea-123',
				created_at: new Date(),
				updated_at: new Date()
			}),
			update: jest.fn().mockResolvedValue({
				id: 'like-123',
				userId: 'user-123',
				ideaId: 'idea-123',
				created_at: new Date(),
				updated_at: new Date()
			}),
			delete: jest.fn().mockResolvedValue({
				id: 'like-123',
				userId: 'user-123',
				ideaId: 'idea-123',
				created_at: new Date(),
				updated_at: new Date()
			}),
			count: jest.fn().mockResolvedValue(0),
			upsert: jest.fn().mockResolvedValue({
				id: 'like-123',
				userId: 'user-123',
				ideaId: 'idea-123',
				created_at: new Date(),
				updated_at: new Date()
			})
		},
			view: {
			findMany: jest.fn().mockResolvedValue([]),
			findUnique: jest.fn().mockResolvedValue(null),
			findFirst: jest.fn().mockResolvedValue(null),
			create: jest.fn().mockResolvedValue({
				id: 'view-123',
				userId: 'user-123',
				ideaId: 'idea-123',
				created_at: new Date(),
				updated_at: new Date()
			}),
			update: jest.fn().mockResolvedValue({
				id: 'view-123',
				userId: 'user-123',
				ideaId: 'idea-123',
				created_at: new Date(),
				updated_at: new Date()
			}),
			delete: jest.fn().mockResolvedValue({
				id: 'view-123',
				userId: 'user-123',
				ideaId: 'idea-123',
				created_at: new Date(),
				updated_at: new Date()
			}),
			count: jest.fn().mockResolvedValue(0),
			upsert: jest.fn().mockResolvedValue({
				id: 'view-123',
				userId: 'user-123',
				ideaId: 'idea-123',
				created_at: new Date(),
				updated_at: new Date()
			}),
			createMany: jest.fn().mockResolvedValue({ count: 1 })
		},
			follow: {
			findMany: jest.fn().mockResolvedValue([]),
			findUnique: jest.fn().mockResolvedValue(null),
			findFirst: jest.fn().mockResolvedValue(null),
			create: jest.fn().mockResolvedValue({
				id: 'follow-123',
				followerId: 'user-123',
				followingId: 'user-456',
				created_at: new Date(),
				updated_at: new Date()
			}),
			update: jest.fn().mockResolvedValue({
				id: 'follow-123',
				followerId: 'user-123',
				followingId: 'user-456',
				created_at: new Date(),
				updated_at: new Date()
			}),
			delete: jest.fn().mockResolvedValue({
				id: 'follow-123',
				followerId: 'user-123',
				followingId: 'user-456',
				created_at: new Date(),
				updated_at: new Date()
			}),
			count: jest.fn().mockResolvedValue(0),
			upsert: jest.fn().mockResolvedValue({
				id: 'follow-123',
				followerId: 'user-123',
				followingId: 'user-456',
				created_at: new Date(),
				updated_at: new Date()
			})
		},
			link: {
			findMany: jest.fn().mockResolvedValue([]),
			findUnique: jest.fn().mockResolvedValue(null),
			findFirst: jest.fn().mockResolvedValue(null),
			create: jest.fn().mockResolvedValue({
				id: 'link-123',
				userId: 'user-123',
				url: 'https://example.com',
				title: 'Example Link',
				created_at: new Date(),
				updated_at: new Date()
			}),
			update: jest.fn().mockResolvedValue({
				id: 'link-123',
				userId: 'user-123',
				url: 'https://example.com',
				title: 'Example Link',
				created_at: new Date(),
				updated_at: new Date()
			}),
			delete: jest.fn().mockResolvedValue({
				id: 'link-123',
				userId: 'user-123',
				url: 'https://example.com',
				title: 'Example Link',
				created_at: new Date(),
				updated_at: new Date()
			}),
			count: jest.fn().mockResolvedValue(0),
			upsert: jest.fn().mockResolvedValue({
				id: 'link-123',
				userId: 'user-123',
				url: 'https://example.com',
				title: 'Example Link',
				created_at: new Date(),
				updated_at: new Date()
			})
		},
			tag: {
			findMany: jest.fn().mockResolvedValue([]),
			findUnique: jest.fn().mockResolvedValue(null),
			findFirst: jest.fn().mockResolvedValue(null),
			create: jest.fn().mockResolvedValue({
				id: 'tag-123',
				name: 'test',
				created_at: new Date(),
				updated_at: new Date()
			}),
			update: jest.fn().mockResolvedValue({
				id: 'tag-123',
				name: 'test',
				created_at: new Date(),
				updated_at: new Date()
			}),
			delete: jest.fn().mockResolvedValue({
				id: 'tag-123',
				name: 'test',
				created_at: new Date(),
				updated_at: new Date()
			}),
			count: jest.fn().mockResolvedValue(0),
			upsert: jest.fn().mockResolvedValue({
				id: 'tag-123',
				name: 'test',
				created_at: new Date(),
				updated_at: new Date()
			})
		},
			image: {
			findMany: jest.fn().mockResolvedValue([]),
			findUnique: jest.fn().mockResolvedValue(null),
			findFirst: jest.fn().mockResolvedValue(null),
			create: jest.fn().mockResolvedValue({
				id: 'image-123',
				ideaId: 'idea-123',
				url: 'https://example.com/image.jpg',
				created_at: new Date(),
				updated_at: new Date()
			}),
			update: jest.fn().mockResolvedValue({
				id: 'image-123',
				ideaId: 'idea-123',
				url: 'https://example.com/image.jpg',
				created_at: new Date(),
				updated_at: new Date()
			}),
			delete: jest.fn().mockResolvedValue({
				id: 'image-123',
				ideaId: 'idea-123',
				url: 'https://example.com/image.jpg',
				created_at: new Date(),
				updated_at: new Date()
			}),
			count: jest.fn().mockResolvedValue(0),
			upsert: jest.fn().mockResolvedValue({
				id: 'image-123',
				ideaId: 'idea-123',
				url: 'https://example.com/image.jpg',
				created_at: new Date(),
				updated_at: new Date()
			})
		},
			// Mock das operações de transação
			$transaction: jest.fn().mockImplementation(async (queries: any[]) => {
				console.log('🔍 Mock $transaction - Iniciando com queries:', queries.length)
				try {
					// Executa as queries em paralelo
					const results = await Promise.all(queries.map((query: any) => query()))
					console.log('✅ Mock $transaction - Sucesso:', results)
					return results
				} catch (error) {
					console.error('❌ Mock $transaction - Erro:', error)
					throw error
				}
			}),
			// Mock das operações de conexão
			$connect: jest.fn().mockResolvedValue(undefined),
			$disconnect: jest.fn().mockResolvedValue(undefined)
		})

		// Registra as dependências necessárias
		// Apenas os 3 serviços externos devem ser mockados conforme guidelines
		container
			.register<PrismaClient>('PostgresqlClient', { useValue: mockPrismaClient })
			.register('S3Client', { useValue: mockS3Client })
			.register('SESClient', { useValue: mockSESClient })
			.register('RouteLister', { useClass: RouteLister })
			.register('StartupModuleManager', { useClass: StartupModuleManager })
			.register('AppModule', { useClass: AppModule })
			.register('Logger', { useClass: Logger })
			.register('IdeaRepository', { useClass: IdeaRepository })
			.register('UserRepository', { useClass: UserRepository })
			.register('FollowRepository', { useClass: FollowRepository })
			.register('LinkRepository', { useClass: LinkRepository })
			.register('CommentRepository', { useClass: CommentRepository })
			.register('LikeRepository', { useClass: LikeRepository })
			.register('ViewRepository', { useClass: ViewRepository })
			.register('S3Gateway', { useClass: S3Gateway })
			.register('IdeaGateway', { useClass: IdeaGateway })
			.register('UserGateway', { useClass: UserGateway })
			.register('AuthGateway', { useClass: AuthGateway })
			.register('SESGateway', { useClass: SESGateway })
			.register('RecordViewController', { useClass: RecordViewController })

		// Cria instância do App
		this.app = new App(
			container.resolve('AppModule'),
			container.resolve('Logger')
		)

		// Aplica mocks padrão antes de iniciar o servidor
		this.setupDefaultMocks()

		// Inicia o servidor
		await this.app.start()

		// Aguarda um pouco para o servidor inicializar
		await new Promise(resolve => setTimeout(resolve, 2000))

		return 'http://localhost:8080'
	}

	/**
	 * Para o servidor após os testes
	 */
	static async stopServer(): Promise<void> {
		if (this.app) {
			this.app.stop()
		}
	}

	/**
	 * Obtém a URL base do servidor
	 */
	static getBaseUrl(): string {
		return 'http://localhost:8080'
	}

	/**
	 * Obtém o mock do Prisma Client
	 */
	static getMockPrismaClient() {
		return container.resolve('PostgresqlClient') as any
	}

	/**
	 * Obtém a instância do App
	 */
	static getApp(): App {
		return this.app
	}

	/**
	 * Aplica mocks padrão para todos os testes
	 */
	static setupDefaultMocks(): void {
		// Mock padrão do Prisma
		const mockPrismaClient = container.resolve('PostgresqlClient') as any
		
		// Mock das operações básicas do Prisma usando a abordagem correta
		mockPrismaClient.user.findUnique.mockResolvedValue(null)
		mockPrismaClient.user.findMany.mockResolvedValue([])
		mockPrismaClient.user.create.mockResolvedValue({})
		mockPrismaClient.user.update.mockResolvedValue({})
		mockPrismaClient.user.delete.mockResolvedValue({})
		mockPrismaClient.user.count.mockResolvedValue(0)

		mockPrismaClient.idea.findUnique.mockResolvedValue(null)
		mockPrismaClient.idea.findMany.mockResolvedValue([])
		mockPrismaClient.idea.create.mockResolvedValue({})
		mockPrismaClient.idea.update.mockResolvedValue({})
		mockPrismaClient.idea.delete.mockResolvedValue({})
		mockPrismaClient.idea.count.mockResolvedValue(0)

		mockPrismaClient.userProfile.findUnique.mockResolvedValue(null)
		mockPrismaClient.userProfile.findMany.mockResolvedValue([])
		mockPrismaClient.userProfile.create.mockResolvedValue({})
		mockPrismaClient.userProfile.update.mockResolvedValue({})
		mockPrismaClient.userProfile.delete.mockResolvedValue({})
		mockPrismaClient.userProfile.count.mockResolvedValue(0)

		mockPrismaClient.comment.findUnique.mockResolvedValue(null)
		mockPrismaClient.comment.findMany.mockResolvedValue([])
		mockPrismaClient.comment.create.mockResolvedValue({})
		mockPrismaClient.comment.update.mockResolvedValue({})
		mockPrismaClient.comment.delete.mockResolvedValue({})
		mockPrismaClient.comment.count.mockResolvedValue(0)

		mockPrismaClient.like.findUnique.mockResolvedValue(null)
		mockPrismaClient.like.findMany.mockResolvedValue([])
		mockPrismaClient.like.create.mockResolvedValue({})
		mockPrismaClient.like.update.mockResolvedValue({})
		mockPrismaClient.like.delete.mockResolvedValue({})
		mockPrismaClient.like.count.mockResolvedValue(0)

		mockPrismaClient.view.findUnique.mockResolvedValue(null)
		mockPrismaClient.view.findMany.mockResolvedValue([])
		mockPrismaClient.view.create.mockResolvedValue({})
		mockPrismaClient.view.update.mockResolvedValue({})
		mockPrismaClient.view.delete.mockResolvedValue({})
		mockPrismaClient.view.count.mockResolvedValue(0)

		mockPrismaClient.follow.findUnique.mockResolvedValue(null)
		mockPrismaClient.follow.findMany.mockResolvedValue([]) // Comentado para não interferir nos testes
		mockPrismaClient.follow.create.mockResolvedValue({})
		mockPrismaClient.follow.update.mockResolvedValue({})
		mockPrismaClient.follow.delete.mockResolvedValue({})
		mockPrismaClient.follow.count.mockResolvedValue(0) // Comentado para não interferir nos testes

		mockPrismaClient.link.findUnique.mockResolvedValue(null)
		mockPrismaClient.link.findMany.mockResolvedValue([])
		mockPrismaClient.link.create.mockResolvedValue({})
		mockPrismaClient.link.update.mockResolvedValue({})
		mockPrismaClient.link.delete.mockResolvedValue({})
		mockPrismaClient.link.count.mockResolvedValue(0)

		mockPrismaClient.tag.findUnique.mockResolvedValue(null)
		mockPrismaClient.tag.findMany.mockResolvedValue([])
		mockPrismaClient.tag.create.mockResolvedValue({})
		mockPrismaClient.tag.update.mockResolvedValue({})
		mockPrismaClient.tag.delete.mockResolvedValue({})
		mockPrismaClient.tag.count.mockResolvedValue(0)

		mockPrismaClient.image.findUnique.mockResolvedValue(null)
		mockPrismaClient.image.findMany.mockResolvedValue([])
		mockPrismaClient.image.create.mockResolvedValue({})
		mockPrismaClient.image.update.mockResolvedValue({})
		mockPrismaClient.image.delete.mockResolvedValue({})
		mockPrismaClient.image.count.mockResolvedValue(0)

		mockPrismaClient.$transaction.mockImplementation(async (callback: any) => {
			return await callback(mockPrismaClient)
		})
		mockPrismaClient.$connect.mockResolvedValue(undefined)
		mockPrismaClient.$disconnect.mockResolvedValue(undefined)
	}

	/**
	 * Limpa todos os mocks
	 */
	static clearMocks(): void {
		jest.clearAllMocks()
	}

	/**
	 * Configura mocks específicos para um teste
	 */
	static setupMocks(mocks: {
		prisma?: any
		s3?: any
		ses?: any
		logger?: any
		repositories?: any
		gateways?: any
	}): void {
		const mockPrismaClient = container.resolve('PostgresqlClient') as any
		const mockS3Client = container.resolve('S3Client') as any
		const mockSESClient = container.resolve('SESClient') as any
		const mockLogger = container.resolve('Logger') as any

		// Aplica mocks do Prisma
		if (mocks.prisma) {
			Object.keys(mocks.prisma).forEach(table => {
				Object.keys(mocks.prisma[table]).forEach(method => {
					if (typeof mocks.prisma[table][method] === 'function') {
						mockPrismaClient[table][method].mockImplementation(mocks.prisma[table][method])
					} else {
						mockPrismaClient[table][method].mockResolvedValue(mocks.prisma[table][method])
					}
				})
			})
		}

		// Aplica mocks de repositories
		if (mocks.repositories) {
			Object.keys(mocks.repositories).forEach(repositoryName => {
				const repository = container.resolve(repositoryName) as any
				console.log(`🔧 Mocking ${repositoryName}:`, Object.keys(mocks.repositories[repositoryName]))
				Object.keys(mocks.repositories[repositoryName]).forEach(method => {
					jest.spyOn(repository, method).mockImplementation(mocks.repositories[repositoryName][method])
					console.log(`  ✅ Mocked ${method}`)
				})
			})
		}

		// Aplica mocks de gateways
		if (mocks.gateways) {
			Object.keys(mocks.gateways).forEach(gatewayName => {
				const gateway = container.resolve(gatewayName) as any
				console.log(`🔧 Mocking ${gatewayName}:`, Object.keys(mocks.gateways[gatewayName]))
				Object.keys(mocks.gateways[gatewayName]).forEach(method => {
					jest.spyOn(gateway, method).mockImplementation(mocks.gateways[gatewayName][method])
					console.log(`  ✅ Mocked ${method}`)
				})
			})
		}

		// Aplica mocks do S3
		if (mocks.s3) {
			Object.keys(mocks.s3).forEach(method => {
				if (typeof mocks.s3[method] === 'function') {
					mockS3Client[method].mockImplementation(mocks.s3[method])
				} else {
					mockS3Client[method].mockResolvedValue(mocks.s3[method])
				}
			})
		}

		// Aplica mocks do SES
		if (mocks.ses) {
			Object.keys(mocks.ses).forEach(method => {
				if (typeof mocks.ses[method] === 'function') {
					mockSESClient[method].mockImplementation(mocks.ses[method])
				} else {
					mockSESClient[method].mockResolvedValue(mocks.ses[method])
				}
			})
		}

		// Aplica mocks do Logger
		if (mocks.logger) {
			Object.keys(mocks.logger).forEach(method => {
				mockLogger[method].mockImplementation(mocks.logger[method])
			})
		}
	}
}

// Configurações globais do Jest
let globalBaseUrl: string

beforeAll(async () => {
	console.log('🚀 Starting Integration Tests...')
	
	// Inicia o servidor uma única vez para todos os testes
	globalBaseUrl = await IntegrationTestSetup.startServer()
	
	console.log(`🌐 Test server started at ${globalBaseUrl}`)
})

afterAll(async () => {
	console.log('🔄 Stopping test server...')
	
	// Para o servidor após todos os testes
	await IntegrationTestSetup.stopServer()
	
	console.log('✅ Integration Tests Completed')
})

// Configurações para cada teste
beforeEach(() => {
	// Limpa console.log para evitar spam nos testes
	// jest.spyOn(console, 'log').mockImplementation(() => {})
	jest.spyOn(console, 'warn').mockImplementation(() => {})
	jest.spyOn(console, 'error').mockImplementation(() => {})
	
	// Limpa mocks antes de cada teste
	IntegrationTestSetup.clearMocks()
})

afterEach(() => {
	// Restaura console.log após cada teste
	jest.restoreAllMocks()
})

// Configurações de timeout
jest.setTimeout(30000) // 30 segundos por teste

// Exporta a URL base global para os testes
export { globalBaseUrl }

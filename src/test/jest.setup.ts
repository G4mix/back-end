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

// Import repositories (não precisam ser mockados - usam Prisma mockado)
import { UserRepository } from '@shared/repositories/user.repository'
import { IdeaRepository } from '@shared/repositories/idea.repository'
import { CommentRepository } from '@shared/repositories/comment.repository'
import { FollowRepository } from '@shared/repositories/follow.repository'
import { LikeRepository } from '@shared/repositories/like.repository'
import { ViewRepository } from '@shared/repositories/view.repository'

// Import gateways (não precisam ser mockados - usam serviços externos mockados)
import { AuthGateway } from '@shared/gateways/auth.gateway'
import { UserGateway } from '@shared/gateways/user.gateway'
import { SESGateway } from '@shared/gateways/ses.gateway'
import { S3Gateway } from '@shared/gateways/s3.gateway'

// Helper para criar mocks padrão do Prisma
const createPrismaTableMock = () => ({
	findMany: jest.fn(),
	findUnique: jest.fn(),
	findFirst: jest.fn(),
	create: jest.fn(),
	update: jest.fn(),
	delete: jest.fn(),
	count: jest.fn(),
	upsert: jest.fn()
})

// Mock do Prisma
jest.mock('@prisma/client', () => ({
	PrismaClient: jest.fn().mockImplementation(() => ({
		user: createPrismaTableMock(),
		userProfile: createPrismaTableMock(),
		idea: createPrismaTableMock(),
		comment: createPrismaTableMock(),
		like: { ...createPrismaTableMock(), deleteMany: jest.fn() },
		view: { ...createPrismaTableMock(), createMany: jest.fn() },
		follow: createPrismaTableMock(),
		tag: createPrismaTableMock(),
		image: createPrismaTableMock(),
		link: createPrismaTableMock(),
		userOAuth: createPrismaTableMock(),
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

		// Configura mocks específicos do SES
		mockSESClient.send = jest.fn().mockResolvedValue({
			MessageId: 'test-message-id-123'
		})

		// Configura mocks específicos do Prisma
		mockPrismaClient.$queryRaw = jest.fn()
			.mockResolvedValueOnce([{ test: 1 }]) // Para o primeiro $queryRaw (SELECT 1 as test)
			.mockResolvedValueOnce([{ // Para o segundo $queryRaw (database info)
				database_name: 'test_db',
				current_user: 'test_user',
				postgres_version: 'PostgreSQL 15.0'
			}])

		// Mock das operações de transação
		;(mockPrismaClient.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
			return await callback(mockPrismaClient)
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
			// Registra repositories
			.register('UserRepository', { useClass: UserRepository })
			.register('IdeaRepository', { useClass: IdeaRepository })
			.register('CommentRepository', { useClass: CommentRepository })
			.register('FollowRepository', { useClass: FollowRepository })
			.register('LikeRepository', { useClass: LikeRepository })
			.register('ViewRepository', { useClass: ViewRepository })
			// Registra gateways
			.register('AuthGateway', { useClass: AuthGateway })
			.register('UserGateway', { useClass: UserGateway })
			.register('SESGateway', { useClass: SESGateway })
			.register('S3Gateway', { useClass: S3Gateway })

		// Cria instância do App
		this.app = new App(
			container.resolve('AppModule'),
			container.resolve('Logger')
		)

		// Inicia o servidor
		await this.app.start()

		// Aplica mocks padrão
		this.setupDefaultMocks()

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
		const mockPrismaClient = container.resolve('PostgresqlClient') as any
		const tables = ['user', 'idea', 'userProfile', 'comment', 'like', 'view', 'follow', 'link', 'tag', 'image', 'userOAuth']

		// Aplica mocks padrão para todas as tabelas
		tables.forEach(table => {
			const tableMock = mockPrismaClient[table]
			tableMock.findUnique.mockResolvedValue(null)
			tableMock.findFirst.mockResolvedValue(null)
			tableMock.findMany.mockResolvedValue([])
			tableMock.create.mockResolvedValue({})
			tableMock.update.mockResolvedValue({})
			tableMock.delete.mockResolvedValue({})
			tableMock.count.mockResolvedValue(0)
			tableMock.upsert.mockResolvedValue({})
		})

		// Mocks específicos para operações especiais
		mockPrismaClient.like.deleteMany.mockResolvedValue({ count: 1 })
		mockPrismaClient.view.createMany.mockResolvedValue({ count: 1 })
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
				Object.keys(mocks.repositories[repositoryName]).forEach(method => {
					jest.spyOn(repository, method).mockImplementation(mocks.repositories[repositoryName][method])
				})
			})
		}

		// Aplica mocks de gateways
		if (mocks.gateways) {
			Object.keys(mocks.gateways).forEach(gatewayName => {
				const gateway = container.resolve(gatewayName) as any
				Object.keys(mocks.gateways[gatewayName]).forEach(method => {
					jest.spyOn(gateway, method).mockImplementation(mocks.gateways[gatewayName][method])
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
	// Configura mocks do axios
	AxiosMockHelper.setupAxiosMock()
	AxiosMockHelper.mockSocialLoginCalls()

	// Inicia o servidor uma única vez para todos os testes
	globalBaseUrl = await IntegrationTestSetup.startServer()
})

afterAll(async () => {
	// Para o servidor após todos os testes
	await IntegrationTestSetup.stopServer()
})

// Configurações para cada teste
beforeEach(() => {
	// Suprime logs de console durante os testes para evitar spam
	jest.spyOn(console, 'warn').mockImplementation(() => {})
	jest.spyOn(console, 'error').mockImplementation(() => {})

	// Limpa mocks antes de cada teste
	IntegrationTestSetup.clearMocks()
})

// Utilitário para mock do axios
export class AxiosMockHelper {
	private static originalAxios: any
	private static mockImplementations: Map<string, jest.Mock> = new Map()

	static setupAxiosMock() {
		const axios = require('axios')
		this.originalAxios = axios
		
		const isLocalUrl = (url: string) => 
			url.includes('localhost') || url.includes('127.0.0.1') || url.startsWith('/')

		const createMockMethod = (method: string) => {
			const mock = jest.fn().mockImplementation((url: string, ...args: any[]) => {
				if (isLocalUrl(url)) {
					return this.originalAxios[method](url, ...args)
				}
				return Promise.resolve({ data: {} })
			})
			this.mockImplementations.set(method, mock)
			jest.spyOn(axios, method).mockImplementation(mock)
			return mock
		}

		// Cria mocks para todos os métodos HTTP
		createMockMethod('get')
		createMockMethod('post')
		createMockMethod('put')
		createMockMethod('delete')
		createMockMethod('patch')
	}

	static mockExternalCall(method: 'get' | 'post' | 'put' | 'delete' | 'patch', urlPattern: string, response: any) {
		const mock = this.mockImplementations.get(method)
		if (!mock) return

		mock.mockImplementation((url: string, ...args: any[]) => {
			// Se for uma URL local, permite chamada real
			if (url.includes('localhost') || url.includes('127.0.0.1') || url.startsWith('/')) {
				return this.originalAxios[method](url, ...args)
			}
			// Se corresponde ao padrão específico, retorna o mock
			if (url.includes(urlPattern)) {
				return Promise.resolve(response)
			}
			// Para outras URLs externas, usa mock padrão
			return Promise.resolve({ data: {} })
		})
	}

	static mockSocialLoginCalls() {
		// Mock para Google - getUserData
		this.mockExternalCall('get', 'www.googleapis.com/userinfo/v2/me', {
			data: {
				id: 'mock-google-user-id',
				email: 'test@example.com',
				name: 'Test User',
				picture: 'https://example.com/avatar.jpg'
			}
		})

		this.mockExternalCall('post', 'oauth2.googleapis.com/token', {
			data: {
				access_token: 'mock-google-access-token',
				token_type: 'Bearer',
				expires_in: 3600
			}
		})

		this.mockExternalCall('post', 'oauth2.googleapis.com/revoke', {
			data: {}
		})

		// Mock para GitHub - getUserData
		this.mockExternalCall('get', 'api.github.com/user', {
			data: {
				id: 'mock-github-user-id',
				login: 'testuser',
				email: 'test@example.com',
				name: 'Test User',
				avatar_url: 'https://example.com/avatar.jpg'
			}
		})

		// Mock para GitHub - getUserPrimaryEmail
		this.mockExternalCall('get', 'api.github.com/user/emails', {
			data: [
				{ email: 'test@example.com', primary: true, verified: true },
				{ email: 'secondary@example.com', primary: false, verified: true }
			]
		})

		this.mockExternalCall('post', 'github.com/login/oauth/access_token', {
			data: {
				access_token: 'mock-github-access-token',
				token_type: 'bearer',
				scope: 'user:email'
			}
		})

		this.mockExternalCall('delete', 'api.github.com/applications', {
			data: {}
		})

		// Mock para LinkedIn - getUser
		this.mockExternalCall('get', 'api.linkedin.com/v2/userinfo', {
			data: {
				id: 'mock-linkedin-user-id',
				firstName: { localized: { 'en_US': 'Test' } },
				lastName: { localized: { 'en_US': 'User' } },
				email: 'test@example.com',
				name: 'Test User',
				profilePicture: { 'displayImage~': { elements: [{ identifiers: [{ identifier: 'https://example.com/avatar.jpg' }] }] } }
			}
		})

		this.mockExternalCall('post', 'linkedin.com/oauth/v2/accessToken', {
			data: {
				access_token: 'mock-linkedin-access-token',
				expires_in: 5184000
			}
		})

		this.mockExternalCall('post', 'linkedin.com/oauth/v2/revoke', {
			data: {}
		})
	}

	static clearMocks() {
		this.mockImplementations.forEach(mock => {
			mock.mockClear()
		})
	}
}

afterEach(() => {
	// Restaura mocks após cada teste
	jest.restoreAllMocks()
})

// Configurações de timeout otimizadas
jest.setTimeout(20000) // 20 segundos por teste (reduzido de 30s)

// Configurações adicionais do Jest
jest.retryTimes(0) // Não tenta novamente em caso de falha
jest.clearAllMocks() // Limpa todos os mocks automaticamente

// Exporta a URL base global para os testes
export { globalBaseUrl }

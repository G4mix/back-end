import { App } from '@config/app'
import { container } from 'tsyringe'

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
		$disconnect: jest.fn()
	}))
}))

// Mock do AWS S3
jest.mock('@aws-sdk/client-s3', () => ({
	S3Client: jest.fn().mockImplementation(() => ({
		send: jest.fn()
	})),
	PutObjectCommand: jest.fn(),
	DeleteObjectCommand: jest.fn(),
	GetObjectCommand: jest.fn()
}))

// Mock do AWS SES
jest.mock('@aws-sdk/client-ses', () => ({
	SESClient: jest.fn().mockImplementation(() => ({
		send: jest.fn()
	})),
	SendEmailCommand: jest.fn()
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
	private static port: number
	private static baseUrl: string

	/**
	 * Inicia o servidor para testes de integração
	 */
	static async startServer(): Promise<string> {
		// Gera uma porta aleatória para evitar conflitos
		this.port = Math.floor(Math.random() * 10000) + 3000
		this.baseUrl = `http://localhost:${this.port}`

		// Cria instância do App
		this.app = new App(
			container.resolve('AppModule'),
			container.resolve('Logger')
		)

		// Inicia o servidor
		await this.app.start()

		// Aguarda um pouco para o servidor inicializar
		await new Promise(resolve => setTimeout(resolve, 1000))

		return this.baseUrl
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
		return this.baseUrl
	}

	/**
	 * Obtém a porta do servidor
	 */
	static getPort(): number {
		return this.port
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
	}): void {
		if (mocks.prisma) {
			const { PrismaClient } = require('@prisma/client')
			const mockPrisma = new PrismaClient()
			Object.assign(mockPrisma, mocks.prisma)
		}

		if (mocks.s3) {
			const { S3Client } = require('@aws-sdk/client-s3')
			const mockS3 = new S3Client()
			Object.assign(mockS3, mocks.s3)
		}

		if (mocks.ses) {
			const { SESClient } = require('@aws-sdk/client-ses')
			const mockSES = new SESClient()
			Object.assign(mockSES, mocks.ses)
		}

		if (mocks.logger) {
			const { Logger } = require('@shared/utils/logger')
			const mockLogger = new Logger()
			Object.assign(mockLogger, mocks.logger)
		}
	}
}

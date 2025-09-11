import 'reflect-metadata'

// Mock do Prisma
jest.mock('@prisma/client', () => ({
	PrismaClient: jest.fn().mockImplementation(() => ({
		user: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn().mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'test@example.com',
				username: 'testuser',
				created_at: new Date(),
				updated_at: new Date()
			}),
			update: jest.fn(),
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
		$queryRaw: jest.fn().mockResolvedValue([{ version: 'PostgreSQL 15.0' }])
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
	SendEmailCommand: jest.fn(),
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

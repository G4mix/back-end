import { RecoverEmailController } from './recover-email.controller'

// Mock completo do Prisma Client
jest.mock('@prisma/client', () => ({
	PrismaClient: jest.fn().mockImplementation(() => ({
		user: {
			findUnique: jest.fn(),
			findMany: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn()
		},
		userProfile: {
			findUnique: jest.fn(),
			findMany: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn()
		},
		userCode: {
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn()
		}
	})),
	Prisma: {
		QueryMode: {
			insensitive: 'insensitive'
		}
	}
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

jest.mock('@shared/utils', () => ({
	generateRandomCode: jest.fn(() => 'ABC123'),
	JwtManager: {
		generateToken: jest.fn((payload: any) => `jwt_token_${payload.sub}`),
		decode: jest.fn()
	}
}))

describe('RecoverEmailController', () => {
	let controller: RecoverEmailController
	let mockUserRepository: any
	let mockSESGateway: any
	let mockLogger: any

	const mockUser = {
		id: 'user-123',
		username: 'testuser',
		email: 'test@example.com',
		verified: true,
		created_at: new Date(),
		updated_at: new Date(),
		userProfileId: 'profile-123',
		loginAttempts: 0,
		blockedUntil: null,
		userCode: {
			id: 'code-123',
			code: 'ABC123',
			updated_at: new Date()
		}
	}

	beforeEach(() => {
		mockUserRepository = {
			findByEmail: jest.fn(),
			update: jest.fn()
		}
		mockSESGateway = {
			sendEmail: jest.fn()
		}
		mockLogger = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn()
		}
		controller = new RecoverEmailController(mockUserRepository, mockSESGateway, mockLogger)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('sendRecoverEmail', () => {
		it('should send recovery email successfully', async () => {
			// Arrange
			mockUserRepository.findByEmail.mockResolvedValue(mockUser)
			mockSESGateway.sendEmail.mockResolvedValue({ success: true })
			mockUserRepository.update.mockResolvedValue(mockUser)

			// Act
			const result = await controller.sendRecoverEmail({ email: 'test@example.com' })

			// Assert
			expect(result).toEqual({ email: 'test@example.com' })
			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith({ email: 'test@example.com' })
			expect(mockSESGateway.sendEmail).toHaveBeenCalledWith({
				template: 'RecoverEmailCodeTemplate',
				receiver: 'test@example.com',
				data: { code: 'ABC123' }
			})
			expect(mockUserRepository.update).toHaveBeenCalledWith({ id: 'user-123', code: 'ABC123' })
		})

		it('should return USER_NOT_FOUND when user does not exist', async () => {
			// Arrange
			mockUserRepository.findByEmail.mockResolvedValue(null)

			// Act
			const result = await controller.sendRecoverEmail({ email: 'nonexistent@example.com' })

			// Assert
			expect(result).toBe('USER_NOT_FOUND')
			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith({ email: 'nonexistent@example.com' })
			expect(mockSESGateway.sendEmail).not.toHaveBeenCalled()
		})

		it('should handle email sending failure', async () => {
			// Arrange
			mockUserRepository.findByEmail.mockResolvedValue(mockUser)
			mockSESGateway.sendEmail.mockResolvedValue('EMAIL_SEND_FAILED')

			// Act
			const result = await controller.sendRecoverEmail({ email: 'test@example.com' })

			// Assert
			expect(result).toBe('EMAIL_SEND_FAILED')
			expect(mockSESGateway.sendEmail).toHaveBeenCalled()
			expect(mockUserRepository.update).not.toHaveBeenCalled()
		})

		it('should normalize email to lowercase', async () => {
			// Arrange
			mockUserRepository.findByEmail.mockResolvedValue(mockUser)
			mockSESGateway.sendEmail.mockResolvedValue({ success: true })
			mockUserRepository.update.mockResolvedValue(mockUser)

			// Act
			await controller.sendRecoverEmail({ email: 'TEST@EXAMPLE.COM' })

			// Assert
			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith({ email: 'test@example.com' })
			expect(mockSESGateway.sendEmail).toHaveBeenCalledWith({
				template: 'RecoverEmailCodeTemplate',
				receiver: 'test@example.com',
				data: { code: 'ABC123' }
			})
		})
	})

	describe('verifyEmailCode', () => {
		it('should verify email code successfully', async () => {
			// Arrange
			mockUserRepository.findByEmail.mockResolvedValue(mockUser)

			// Act
			const result = await controller.verifyEmailCode({ 
				code: 'ABC123', 
				email: 'test@example.com' 
			})

			// Assert
			expect(result).toEqual({
				accessToken: 'jwt_token_user-123'
			})
			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith({ email: 'test@example.com' })
		})

		it('should return USER_NOT_FOUND when user does not exist', async () => {
			// Arrange
			mockUserRepository.findByEmail.mockResolvedValue(null)

			// Act
			const result = await controller.verifyEmailCode({ 
				code: 'ABC123', 
				email: 'nonexistent@example.com' 
			})

			// Assert
			expect(result).toBe('USER_NOT_FOUND')
		})

		it('should return USER_NOT_FOUND when user has no code', async () => {
			// Arrange
			const userWithoutCode = { ...mockUser, userCode: null }
			mockUserRepository.findByEmail.mockResolvedValue(userWithoutCode)

			// Act
			const result = await controller.verifyEmailCode({ 
				code: 'ABC123', 
				email: 'test@example.com' 
			})

			// Assert
			expect(result).toBe('USER_NOT_FOUND')
		})

		it('should return CODE_EXPIRED when code is expired', async () => {
			// Arrange
			const expiredUser = {
				...mockUser,
				userCode: {
					...mockUser.userCode,
					updated_at: new Date(Date.now() - 11 * 60 * 1000) // 11 minutes ago
				}
			}
			mockUserRepository.findByEmail.mockResolvedValue(expiredUser)

			// Act
			const result = await controller.verifyEmailCode({ 
				code: 'ABC123', 
				email: 'test@example.com' 
			})

			// Assert
			expect(result).toBe('CODE_EXPIRED')
		})

		it('should return CODE_NOT_EQUALS when code is wrong', async () => {
			// Arrange
			mockUserRepository.findByEmail.mockResolvedValue(mockUser)

			// Act
			const result = await controller.verifyEmailCode({ 
				code: 'WRONG', 
				email: 'test@example.com' 
			})

			// Assert
			expect(result).toBe('CODE_NOT_EQUALS')
		})

		it('should normalize code to uppercase', async () => {
			// Arrange
			mockUserRepository.findByEmail.mockResolvedValue(mockUser)

			// Act
			const result = await controller.verifyEmailCode({ 
				code: 'abc123', 
				email: 'test@example.com' 
			})

			// Assert
			expect(result).toEqual({
				accessToken: 'jwt_token_user-123'
			})
		})

		it('should normalize email to lowercase', async () => {
			// Arrange
			mockUserRepository.findByEmail.mockResolvedValue(mockUser)

			// Act
			await controller.verifyEmailCode({ 
				code: 'ABC123', 
				email: 'TEST@EXAMPLE.COM' 
			})

			// Assert
			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith({ email: 'test@example.com' })
		})
	})
})

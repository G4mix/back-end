import { RefreshTokenController } from './refresh-token.controller'

// Definir mocks uma única vez
const mockUtils = jest.requireMock('@shared/utils')

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
	JwtManager: {
		generateToken: jest.fn((payload: any) => `jwt_token_${payload.sub}`),
		decode: jest.fn((token: string) => {
			if (token === 'invalid_token') {
				throw new Error('Invalid token')
			}
			return { sub: 'user-123' }
		})
	}
}))

// Mock das constantes
jest.mock('@shared/constants', () => ({
	EXPIRATION_TIME_REFRESH_TOKEN: '7d'
}))

describe('RefreshTokenController', () => {
	let controller: RefreshTokenController
	let mockUserRepository: any
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
		userProfile: {
			id: 'profile-123',
			name: 'Test User',
			bio: 'Test bio',
			icon: null,
			created_at: new Date(),
			updated_at: new Date()
		}
	}

	beforeEach(() => {
		mockUserRepository = {
			findById: jest.fn(),
			update: jest.fn()
		}
		mockLogger = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn()
		}
		controller = new RefreshTokenController(mockUserRepository, mockLogger)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('refreshToken', () => {
		it('should refresh token successfully', async () => {
			// Arrange
			mockUserRepository.findById.mockResolvedValue(mockUser)
			mockUserRepository.update.mockResolvedValue(mockUser)

			// Act
			const result = await controller.refreshToken({ token: 'valid_refresh_token' })

			// Assert
			expect(result).toEqual({
				accessToken: 'jwt_token_user-123',
				refreshToken: 'jwt_token_user-123'
			})
			expect(mockUserRepository.findById).toHaveBeenCalledWith({ id: 'user-123' })
			expect(mockUserRepository.update).toHaveBeenCalledWith({ 
				id: 'user-123', 
				token: 'jwt_token_user-123' 
			})
		})

		it('should return UNAUTHORIZED for invalid token', async () => {
			// Arrange
			mockUtils.JwtManager.decode.mockImplementation(() => {
				throw new Error('Invalid token')
			})

			// Act
			const result = await controller.refreshToken({ token: 'invalid_token' })

			// Assert
			expect(result).toBe('UNAUTHORIZED')
			expect(mockUserRepository.findById).not.toHaveBeenCalled()
		})

		it('should return USER_NOT_FOUND when user does not exist', async () => {
			// Arrange
			mockUtils.JwtManager.decode.mockReturnValue({ sub: 'user-123' })
			mockUserRepository.findById.mockResolvedValue(null)

			// Act
			const result = await controller.refreshToken({ token: 'valid_refresh_token' })

			// Assert
			expect(result).toBe('USER_NOT_FOUND')
			expect(mockUserRepository.findById).toHaveBeenCalledWith({ id: 'user-123' })
			expect(mockUserRepository.update).not.toHaveBeenCalled()
		})

		it('should generate new access token', async () => {
			// Arrange
			mockUtils.JwtManager.decode.mockReturnValue({ sub: 'user-123' })
			mockUserRepository.findById.mockResolvedValue(mockUser)
			mockUserRepository.update.mockResolvedValue(mockUser)

			// Act
			const result = await controller.refreshToken({ token: 'valid_refresh_token' })

			// Assert
			expect(result).toHaveProperty('accessToken')
			expect((result as any)?.accessToken).toBe('jwt_token_user-123')
		})

		it('should generate new refresh token', async () => {
			// Arrange
			mockUtils.JwtManager.decode.mockReturnValue({ sub: 'user-123' })
			mockUserRepository.findById.mockResolvedValue(mockUser)
			mockUserRepository.update.mockResolvedValue(mockUser)

			// Act
			const result = await controller.refreshToken({ token: 'valid_refresh_token' })

			// Assert
			expect(result).toHaveProperty('refreshToken')
			expect((result as any)?.refreshToken).toBe('jwt_token_user-123')
		})

		it('should update refresh token in database', async () => {
			// Arrange
			mockUtils.JwtManager.decode.mockReturnValue({ sub: 'user-123' })
			mockUserRepository.findById.mockResolvedValue(mockUser)
			mockUserRepository.update.mockResolvedValue(mockUser)

			// Act
			await controller.refreshToken({ token: 'valid_refresh_token' })

			// Assert
			expect(mockUserRepository.update).toHaveBeenCalledWith({ 
				id: 'user-123', 
				token: 'jwt_token_user-123' 
			})
		})

		it('should handle repository errors gracefully', async () => {
			// Arrange
			mockUtils.JwtManager.decode.mockReturnValue({ sub: 'user-123' })
			mockUserRepository.findById.mockRejectedValue(new Error('Database error'))

			// Act & Assert
			await expect(controller.refreshToken({ token: 'valid_refresh_token' }))
				.rejects.toThrow('Database error')
		})

		it('should decode token to get user ID', async () => {
			// Arrange
			mockUserRepository.findById.mockResolvedValue(mockUser)
			mockUserRepository.update.mockResolvedValue(mockUser)

			// Act
			await controller.refreshToken({ token: 'valid_refresh_token' })

			// Assert
			const { JwtManager } = await import('@shared/utils')
			expect(JwtManager.decode).toHaveBeenCalledWith('valid_refresh_token')
		})
	})
})

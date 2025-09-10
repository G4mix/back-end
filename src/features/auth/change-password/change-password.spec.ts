import { ChangePasswordController } from './change-password.controller'

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
	BCryptEncoder: {
		encode: jest.fn((password: string) => `hashed_${password}`),
		compare: jest.fn()
	},
	JwtManager: {
		generateToken: jest.fn((payload: any) => `jwt_token_${payload.sub}`),
		decode: jest.fn()
	}
}))

// Mock das constantes
jest.mock('@shared/constants', () => ({
	EXPIRATION_TIME_REFRESH_TOKEN: '7d'
}))

// Mock do serializer
jest.mock('@shared/utils/serializers', () => ({
	serializeUser: jest.fn((user: any) => ({
		id: user.id,
		username: user.username,
		email: user.email,
		verified: user.verified,
		created_at: user.created_at.toISOString(),
		updated_at: user.updated_at.toISOString(),
		userProfile: user.userProfile ? {
			id: user.userProfile.id,
			icon: user.userProfile.icon,
			displayName: user.userProfile.displayName,
			autobiography: user.userProfile.autobiography,
			backgroundImage: user.userProfile.backgroundImage,
			isFollowing: user.userProfile.isFollowing,
			links: user.userProfile.links,
			followersCount: user.userProfile._count?.followers || 0,
			followingCount: user.userProfile._count?.following || 0
		} : null
	}))
}))

describe('ChangePasswordController', () => {
	let controller: ChangePasswordController
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

	const mockRequest = {
		user: { sub: 'user-123' },
		res: {
			status: jest.fn().mockReturnThis(),
			json: jest.fn()
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
		controller = new ChangePasswordController(mockUserRepository, mockLogger)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('changePassword', () => {
		it('should change password successfully', async () => {
			// Arrange
			mockUserRepository.findById.mockResolvedValue(mockUser)
			mockUserRepository.update.mockResolvedValue(mockUser)

			// Act
			const result = await controller.changePassword(
				{ password: 'NewPassword123!' },
				mockRequest as any
			)

			// Assert
			expect(result).toEqual({
				accessToken: 'jwt_token_user-123',
				refreshToken: 'jwt_token_user-123',
				user: {
					id: 'user-123',
					username: 'testuser',
					email: 'test@example.com',
					verified: true,
					created_at: expect.any(String),
					updated_at: expect.any(String),
					userProfile: {
						id: 'profile-123',
						icon: null,
						displayName: null,
						autobiography: null,
						backgroundImage: null,
						isFollowing: undefined,
						links: [],
						followersCount: 0,
						followingCount: 0
					}
				}
			})
			expect(mockUserRepository.findById).toHaveBeenCalledWith({ id: 'user-123' })
			expect(mockUserRepository.update).toHaveBeenCalledTimes(2)
			expect(mockLogger.info).toHaveBeenCalled()
		})

		it('should return USER_NOT_FOUND when user does not exist', async () => {
			// Arrange
			mockUserRepository.findById.mockResolvedValue(null)

			// Act
			const result = await controller.changePassword(
				{ password: 'NewPassword123!' },
				mockRequest as any
			)

			// Assert
			expect(result).toBe('USER_NOT_FOUND')
			expect(mockUserRepository.findById).toHaveBeenCalledWith({ id: 'user-123' })
			expect(mockUserRepository.update).not.toHaveBeenCalled()
		})

		it('should handle repository errors gracefully', async () => {
			// Arrange
			mockUserRepository.findById.mockRejectedValue(new Error('Database error'))

			// Act & Assert
			await expect(controller.changePassword(
				{ password: 'NewPassword123!' },
				mockRequest as any
			)).rejects.toThrow('Database error')
		})

		it('should update password with hashed value', async () => {
			// Arrange
			mockUserRepository.findById.mockResolvedValue(mockUser)
			mockUserRepository.update.mockResolvedValue(mockUser)

			// Act
			await controller.changePassword(
				{ password: 'NewPassword123!' },
				mockRequest as any
			)

			// Assert
			expect(mockUserRepository.update).toHaveBeenCalledWith({
				id: 'user-123',
				password: 'hashed_NewPassword123!'
			})
		})

		it('should generate new tokens after password change', async () => {
			// Arrange
			mockUserRepository.findById.mockResolvedValue(mockUser)
			mockUserRepository.update.mockResolvedValue(mockUser)

			// Act
			const result = await controller.changePassword(
				{ password: 'NewPassword123!' },
				mockRequest as any
			)

			// Assert
			expect(result).toHaveProperty('accessToken')
			expect(result).toHaveProperty('refreshToken')
			expect(result).toHaveProperty('user')
		})
	})
})

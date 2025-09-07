import { SigninController } from './signin.controller'

// Definir mocks uma única vez
const mockUtils = jest.requireMock('@shared/utils')

// Mock completo do Prisma Client
jest.mock('@prisma/client', () => ({
	PrismaClient: jest.fn().mockImplementation(() => ({
		user: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn()
		},
		userProfile: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
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

// Mock do SESGateway
jest.mock('@shared/gateways/ses.gateway', () => ({
	SESGateway: jest.fn().mockImplementation(() => ({
		verifyIdentity: jest.fn(),
		sendEmail: jest.fn(),
		checkEmailStatus: jest.fn()
	}))
}))

jest.mock('@shared/utils', () => ({
	BCryptEncoder: {
		encode: jest.fn(),
		compare: jest.fn()
	},
	JwtManager: {
		generateToken: jest.fn()
	}
}))

// Mock das constantes
jest.mock('@shared/constants', () => ({
	EXPIRATION_TIME_REFRESH_TOKEN: '7d'
}))

describe('SigninController', () => {
	let controller: SigninController
	let mockUserRepository: any
	let mockSESGateway: any
	let mockLogger: any

	beforeEach(() => {
		// Mock completo do UserRepository
		mockUserRepository = {
			findAll: jest.fn(),
			findById: jest.fn(),
			findByEmail: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn()
		}

		// Mock completo do SESGateway
		mockSESGateway = {
			verifyIdentity: jest.fn(),
			sendEmail: jest.fn(),
			checkEmailStatus: jest.fn()
		}

		// Mock completo do Logger
		mockLogger = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn(),
			log: jest.fn()
		}

		controller = new SigninController(mockUserRepository, mockSESGateway, mockLogger)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('signin', () => {
		it('should signin user successfully', async () => {
			// Arrange
			const signinInput = {
				email: 'john@example.com',
				password: 'Password123!'
			}

			const mockUser = {
				id: 'user-123',
				username: 'john_doe',
				email: 'john@example.com',
				password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
				verified: true,
				created_at: new Date('2023-01-01'),
				updated_at: new Date('2023-01-01'),
				userProfileId: 'profile-123',
				loginAttempts: 0,
				blockedUntil: null,
				userProfile: {
					id: 'profile-123',
					icon: null,
					displayName: 'John Doe',
					autobiography: 'Bio',
					backgroundImage: null,
					isFollowing: false,
					links: [],
					_count: { followers: 5, following: 10 }
				}
			}

			const mockUpdatedUser = {
				...mockUser,
				loginAttempts: 0,
				token: 'refresh_token'
			}

			mockUserRepository.findByEmail.mockResolvedValue(mockUser)
mockUtils.BCryptEncoder.compare.mockReturnValue(true)
mockUtils.JwtManager.generateToken.mockReturnValueOnce('access_token').mockReturnValueOnce('refresh_token')
			mockUserRepository.update.mockResolvedValue(mockUpdatedUser)

			// Act
			const result = await controller.signin(signinInput)

			// Assert
			expect(result).toEqual({
				accessToken: 'access_token',
				refreshToken: 'refresh_token',
				user: {
					id: 'user-123',
					username: 'john_doe',
					email: 'john@example.com',
					verified: true,
					created_at: '2023-01-01T00:00:00.000Z',
					updated_at: '2023-01-01T00:00:00.000Z',
					userProfile: {
						id: 'profile-123',
						icon: null,
						displayName: 'John Doe',
						autobiography: 'Bio',
						backgroundImage: null,
						isFollowing: false,
						links: [],
						followersCount: 5,
						followingCount: 10
					}
				}
			})
			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith({ email: 'john@example.com' })
			expect(mockUtils.BCryptEncoder.compare).toHaveBeenCalledWith('Password123!', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
			expect(mockUtils.JwtManager.generateToken).toHaveBeenCalledWith({
				sub: 'user-123',
				userProfileId: 'profile-123'
			})
		})

		it('should return USER_NOT_FOUND when user does not exist', async () => {
			// Arrange
			const signinInput = {
				email: 'nonexistent@example.com',
				password: 'Password123!'
			}

			mockUserRepository.findByEmail.mockResolvedValue(null)

			// Act
			const result = await controller.signin(signinInput)

			// Assert
			expect(result).toBe('USER_NOT_FOUND')
			expect(mockUtils.BCryptEncoder.compare).not.toHaveBeenCalled()
		})

		it('should verify email and send welcome email for unverified user', async () => {
			// Arrange
			const signinInput = {
				email: 'john@example.com',
				password: 'Password123!'
			}

			const mockUser = {
				id: 'user-123',
				username: 'john_doe',
				email: 'john@example.com',
				verified: false,
				created_at: new Date('2023-01-01'),
				updated_at: new Date('2023-01-01'),
				userProfileId: 'profile-123',
				loginAttempts: 0,
				blockedUntil: null,
				userProfile: {
					id: 'profile-123',
					icon: null,
					displayName: 'John Doe',
					autobiography: 'Bio',
					backgroundImage: null,
					isFollowing: false,
					links: [],
					_count: { followers: 5, following: 10 }
				}
			}

			const mockVerifiedUser = {
				...mockUser,
				verified: true
			}

			mockUserRepository.findByEmail.mockResolvedValueOnce(mockUser)
			mockSESGateway.checkEmailStatus.mockResolvedValue({ status: 'Success' })
			mockUserRepository.update.mockResolvedValueOnce(mockVerifiedUser)
			mockSESGateway.sendEmail.mockResolvedValue(true)
mockUtils.BCryptEncoder.compare.mockReturnValue(true)
mockUtils.JwtManager.generateToken.mockReturnValue('access_token')
			mockUserRepository.update.mockResolvedValueOnce({
				...mockVerifiedUser,
				loginAttempts: 0,
				token: 'refresh_token'
			})

			// Act
			const result = await controller.signin(signinInput)

			// Assert
			expect(result).toBeDefined()
			expect(mockSESGateway.checkEmailStatus).toHaveBeenCalledWith('john@example.com')
			expect(mockSESGateway.sendEmail).toHaveBeenCalledWith({
				template: 'SignUp',
				receiver: 'john@example.com'
			})
		})

		it('should handle wrong password and increment attempts', async () => {
			// Arrange
			const signinInput = {
				email: 'john@example.com',
				password: 'WrongPassword'
			}

			const mockUser = {
				id: 'user-123',
				username: 'john_doe',
				email: 'john@example.com',
				verified: true,
				created_at: new Date('2023-01-01'),
				updated_at: new Date('2023-01-01'),
				userProfileId: 'profile-123',
				loginAttempts: 2,
				blockedUntil: null,
				userProfile: {
					id: 'profile-123',
					icon: null,
					displayName: 'John Doe',
					autobiography: 'Bio',
					backgroundImage: null,
					isFollowing: false,
					links: [],
					_count: { followers: 5, following: 10 }
				}
			}

			mockUserRepository.findByEmail.mockResolvedValue(mockUser)
			mockUtils.BCryptEncoder.compare.mockReturnValue(false)
			mockUserRepository.update.mockResolvedValue({
				...mockUser,
				loginAttempts: 3
			})

			// Act
			const result = await controller.signin(signinInput)

			// Assert
			expect(result).toBe('WRONG_PASSWORD_THREE_TIMES')
			expect(mockUserRepository.update).toHaveBeenCalledWith({
				loginAttempts: 3,
				email: 'john@example.com',
				id: 'user-123',
				blockedUntil: null
			})
		})

		it('should block user after 5 failed attempts', async () => {
			// Arrange
			const signinInput = {
				email: 'john@example.com',
				password: 'WrongPassword'
			}

			const mockUser = {
				id: 'user-123',
				username: 'john_doe',
				email: 'john@example.com',
				verified: true,
				created_at: new Date('2023-01-01'),
				updated_at: new Date('2023-01-01'),
				userProfileId: 'profile-123',
				loginAttempts: 4,
				blockedUntil: null,
				userProfile: {
					id: 'profile-123',
					icon: null,
					displayName: 'John Doe',
					autobiography: 'Bio',
					backgroundImage: null,
					isFollowing: false,
					links: [],
					_count: { followers: 5, following: 10 }
				}
			}

			mockUserRepository.findByEmail.mockResolvedValue(mockUser)
			mockUtils.BCryptEncoder.compare.mockReturnValue(false)
			mockUserRepository.update.mockResolvedValue({
				...mockUser,
				loginAttempts: 5,
				blockedUntil: new Date(Date.now() + 30 * 60 * 1000)
			})

			// Act
			const result = await controller.signin(signinInput)

			// Assert
			expect(result).toBe('WRONG_PASSWORD_FIVE_TIMES')
			expect(mockUserRepository.update).toHaveBeenCalledWith({
				loginAttempts: 5,
				email: 'john@example.com',
				id: 'user-123',
				blockedUntil: expect.any(Date)
			})
		})

		it('should return EXCESSIVE_LOGIN_ATTEMPTS when user is blocked', async () => {
			// Arrange
			const signinInput = {
				email: 'john@example.com',
				password: 'Password123!'
			}

			const mockUser = {
				id: 'user-123',
				username: 'john_doe',
				email: 'john@example.com',
				verified: true,
				created_at: new Date('2023-01-01'),
				updated_at: new Date('2023-01-01'),
				userProfileId: 'profile-123',
				loginAttempts: 5,
				blockedUntil: new Date(Date.now() + 30 * 60 * 1000), // Blocked for 30 minutes
				userProfile: {
					id: 'profile-123',
					icon: null,
					displayName: 'John Doe',
					autobiography: 'Bio',
					backgroundImage: null,
					isFollowing: false,
					links: [],
					_count: { followers: 5, following: 10 }
				}
			}

			mockUserRepository.findByEmail.mockResolvedValue(mockUser)

			// Act
			const result = await controller.signin(signinInput)

			// Assert
			expect(result).toBe('EXCESSIVE_LOGIN_ATTEMPTS')
			expect(mockUtils.BCryptEncoder.compare).not.toHaveBeenCalled()
		})

		it('should reset attempts when user was blocked but time expired', async () => {
			// Arrange
			const signinInput = {
				email: 'john@example.com',
				password: 'Password123!'
			}

			const mockUser = {
				id: 'user-123',
				username: 'john_doe',
				email: 'john@example.com',
				verified: true,
				created_at: new Date('2023-01-01'),
				updated_at: new Date('2023-01-01'),
				userProfileId: 'profile-123',
				loginAttempts: 5,
				blockedUntil: new Date(Date.now() - 30 * 60 * 1000), // Block expired
				userProfile: {
					id: 'profile-123',
					icon: null,
					displayName: 'John Doe',
					autobiography: 'Bio',
					backgroundImage: null,
					isFollowing: false,
					links: [],
					_count: { followers: 5, following: 10 }
				}
			}

			const mockUpdatedUser = {
				...mockUser,
				loginAttempts: 0,
				token: 'refresh_token'
			}

			mockUserRepository.findByEmail.mockResolvedValue(mockUser)
			mockUserRepository.update.mockResolvedValueOnce({ ...mockUser, loginAttempts: 0 })
mockUtils.BCryptEncoder.compare.mockReturnValue(true)
mockUtils.JwtManager.generateToken.mockReturnValue('access_token')
			mockUserRepository.update.mockResolvedValueOnce(mockUpdatedUser)

			// Act
			const result = await controller.signin(signinInput)

			// Assert
			expect(result).toBeDefined()
			expect(mockUserRepository.update).toHaveBeenCalledWith({
				id: 'user-123',
				loginAttempts: 0,
				token: expect.any(String)
			})
		})

		it('should handle repository errors', async () => {
			// Arrange
			const signinInput = {
				email: 'john@example.com',
				password: 'Password123!'
			}

			mockUserRepository.findByEmail.mockRejectedValue(new Error('Database Error'))

			// Act & Assert
			await expect(controller.signin(signinInput)).rejects.toThrow('Database Error')
		})

		it('should normalize email to lowercase', async () => {
			// Arrange
			const signinInput = {
				email: 'JOHN@EXAMPLE.COM',
				password: 'Password123!'
			}

			const mockUser = {
				id: 'user-123',
				username: 'john_doe',
				email: 'john@example.com',
				verified: true,
				created_at: new Date('2023-01-01'),
				updated_at: new Date('2023-01-01'),
				userProfileId: 'profile-123',
				loginAttempts: 0,
				blockedUntil: null,
				userProfile: {
					id: 'profile-123',
					icon: null,
					displayName: 'John Doe',
					autobiography: 'Bio',
					backgroundImage: null,
					isFollowing: false,
					links: [],
					_count: { followers: 5, following: 10 }
				}
			}

			mockUserRepository.findByEmail.mockResolvedValue(mockUser)
mockUtils.BCryptEncoder.compare.mockReturnValue(true)
mockUtils.JwtManager.generateToken.mockReturnValue('access_token')
			mockUserRepository.update.mockResolvedValue({
				...mockUser,
				loginAttempts: 0,
				token: 'refresh_token'
			})

			// Act
			await controller.signin(signinInput)

			// Assert
			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith({ email: 'john@example.com' })
		})
	})
})

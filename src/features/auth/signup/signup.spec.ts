import { SignupController } from './signup.controller'

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

describe('SignupController', () => {
	let controller: SignupController
	let mockUserRepository: any
	let mockSESGateway: any
	let mockLogger: any

	const mockNewUser = {
		id: 'user-123',
		username: 'newuser',
		email: 'newuser@example.com',
		verified: false,
		created_at: new Date(),
		updated_at: new Date(),
		userProfileId: 'profile-123',
		loginAttempts: 0,
		blockedUntil: null,
		userProfile: {
			id: 'profile-123',
			name: null,
			bio: null,
			icon: null,
			created_at: new Date(),
			updated_at: new Date()
		}
	}

	const signupInput = {
		email: 'newuser@example.com',
		password: 'SecurePass123!',
		username: 'newuser'
	}

	beforeEach(() => {
		mockUserRepository = {
			findByEmail: jest.fn(),
			create: jest.fn(),
			update: jest.fn()
		}
		mockSESGateway = {
			verifyIdentity: jest.fn()
		}
		mockLogger = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn()
		}
		controller = new SignupController(mockUserRepository, mockSESGateway, mockLogger)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('signup', () => {
		it('should signup user successfully', async () => {
			// Arrange
			mockUserRepository.findByEmail.mockResolvedValue(null)
			mockSESGateway.verifyIdentity.mockResolvedValue({ success: true })
			mockUserRepository.create.mockResolvedValue(mockNewUser)
			mockUserRepository.update.mockResolvedValue(mockNewUser)

			// Act
			const result = await controller.signup(signupInput)

			// Assert
			expect(result).toEqual({
				accessToken: 'jwt_token_user-123',
				refreshToken: 'jwt_token_user-123',
				user: {
					id: 'user-123',
					username: 'newuser',
					email: 'newuser@example.com',
					verified: false,
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
			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith({ email: 'newuser@example.com' })
			expect(mockSESGateway.verifyIdentity).toHaveBeenCalledWith({ receiver: 'newuser@example.com' })
			expect(mockUserRepository.create).toHaveBeenCalledWith({
				password: 'hashed_SecurePass123!',
				username: 'newuser',
				email: 'newuser@example.com'
			})
		})

		it('should return USER_ALREADY_EXISTS when email already exists', async () => {
			// Arrange
			mockUserRepository.findByEmail.mockResolvedValue(mockNewUser)

			// Act
			const result = await controller.signup(signupInput)

			// Assert
			expect(result).toBe('USER_ALREADY_EXISTS')
			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith({ email: 'newuser@example.com' })
			expect(mockSESGateway.verifyIdentity).not.toHaveBeenCalled()
			expect(mockUserRepository.create).not.toHaveBeenCalled()
		})

		it('should handle email verification failure', async () => {
			// Arrange
			mockUserRepository.findByEmail.mockResolvedValue(null)
			mockSESGateway.verifyIdentity.mockResolvedValue('EMAIL_VERIFICATION_FAILED')

			// Act
			const result = await controller.signup(signupInput)

			// Assert
			expect(result).toBe('EMAIL_VERIFICATION_FAILED')
			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith({ email: 'newuser@example.com' })
			expect(mockSESGateway.verifyIdentity).toHaveBeenCalledWith({ receiver: 'newuser@example.com' })
			expect(mockUserRepository.create).not.toHaveBeenCalled()
		})

		it('should normalize email to lowercase', async () => {
			// Arrange
			mockUserRepository.findByEmail.mockResolvedValue(null)
			mockSESGateway.verifyIdentity.mockResolvedValue({ success: true })
			mockUserRepository.create.mockResolvedValue(mockNewUser)
			mockUserRepository.update.mockResolvedValue(mockNewUser)

			// Act
			await controller.signup({
				...signupInput,
				email: 'NEWUSER@EXAMPLE.COM'
			})

			// Assert
			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith({ email: 'newuser@example.com' })
			expect(mockSESGateway.verifyIdentity).toHaveBeenCalledWith({ receiver: 'newuser@example.com' })
			expect(mockUserRepository.create).toHaveBeenCalledWith({
				password: 'hashed_SecurePass123!',
				username: 'newuser',
				email: 'newuser@example.com'
			})
		})

		it('should hash password before creating user', async () => {
			// Arrange
			mockUserRepository.findByEmail.mockResolvedValue(null)
			mockSESGateway.verifyIdentity.mockResolvedValue({ success: true })
			mockUserRepository.create.mockResolvedValue(mockNewUser)
			mockUserRepository.update.mockResolvedValue(mockNewUser)

			// Act
			await controller.signup(signupInput)

			// Assert
			expect(mockUserRepository.create).toHaveBeenCalledWith({
				password: 'hashed_SecurePass123!',
				username: 'newuser',
				email: 'newuser@example.com'
			})
		})

		it('should generate tokens after user creation', async () => {
			// Arrange
			mockUserRepository.findByEmail.mockResolvedValue(null)
			mockSESGateway.verifyIdentity.mockResolvedValue({ success: true })
			mockUserRepository.create.mockResolvedValue(mockNewUser)
			mockUserRepository.update.mockResolvedValue(mockNewUser)

			// Act
			const result = await controller.signup(signupInput)

			// Assert
			expect(result).toHaveProperty('accessToken')
			expect(result).toHaveProperty('refreshToken')
			expect(result).toHaveProperty('user')
		})

		it('should update refresh token in database', async () => {
			// Arrange
			mockUserRepository.findByEmail.mockResolvedValue(null)
			mockSESGateway.verifyIdentity.mockResolvedValue({ success: true })
			mockUserRepository.create.mockResolvedValue(mockNewUser)
			mockUserRepository.update.mockResolvedValue(mockNewUser)

			// Act
			await controller.signup(signupInput)

			// Assert
			expect(mockUserRepository.update).toHaveBeenCalledWith({ 
				id: 'user-123', 
				token: 'jwt_token_user-123' 
			})
		})

		it('should handle repository errors gracefully', async () => {
			// Arrange
			mockUserRepository.findByEmail.mockResolvedValue(null)
			mockSESGateway.verifyIdentity.mockResolvedValue({ success: true })
			mockUserRepository.create.mockRejectedValue(new Error('Database error'))

			// Act & Assert
			await expect(controller.signup(signupInput)).rejects.toThrow('Database error')
		})
	})
})

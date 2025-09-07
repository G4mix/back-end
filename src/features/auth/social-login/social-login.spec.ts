import { SocialLoginController } from './social-login.controller'

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
		oAuthUser: {
			findUnique: jest.fn(),
			create: jest.fn()
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
	},
	generateRandomPassword: jest.fn(() => 'random_password_123')
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

describe('SocialLoginController', () => {
	let controller: SocialLoginController
	let mockUserRepository: any
	let mockAuthGateway: any
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

	const mockOAuthUser = {
		id: 'oauth-123',
		provider: 'google',
		email: 'test@example.com',
		user: mockUser
	}

	const mockSocialData = {
		email: 'test@example.com',
		name: 'Test User'
	}

	const mockRequest = {
		user: { sub: 'user-123' },
		res: {
			redirect: jest.fn()
		}
	}

	beforeEach(() => {
		mockUserRepository = {
			findOAuthUser: jest.fn(),
			findByEmail: jest.fn(),
			create: jest.fn(),
			linkOAuthProvider: jest.fn(),
			update: jest.fn(),
			findById: jest.fn()
		}
		mockAuthGateway = {
			validateSocialLogin: jest.fn()
		}
		mockLogger = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn()
		}
		controller = new SocialLoginController(mockUserRepository, mockAuthGateway, mockLogger)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('socialLogin', () => {
		it('should login existing OAuth user successfully', async () => {
			// Arrange
			mockAuthGateway.validateSocialLogin.mockResolvedValue({
				valid: true,
				userData: mockSocialData
			})
			mockUserRepository.findOAuthUser.mockResolvedValue(mockOAuthUser)
			mockUserRepository.update.mockResolvedValue(mockUser)

			// Act
			const result = await controller.socialLogin('google', { token: 'valid_token' })

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
						displayName: undefined,
						autobiography: undefined,
						backgroundImage: undefined,
						isFollowing: undefined,
						links: undefined,
						followersCount: 0,
						followingCount: 0
					}
				}
			})
			expect(mockAuthGateway.validateSocialLogin).toHaveBeenCalledWith({
				provider: 'google',
				token: 'valid_token'
			})
			expect(mockUserRepository.findOAuthUser).toHaveBeenCalledWith({
				provider: 'google',
				email: 'test@example.com'
			})
		})

		it('should create new user and link OAuth provider', async () => {
			// Arrange
			mockAuthGateway.validateSocialLogin.mockResolvedValue({
				valid: true,
				userData: mockSocialData
			})
			mockUserRepository.findOAuthUser.mockResolvedValue(null)
			mockUserRepository.findByEmail.mockResolvedValue(null)
			mockUserRepository.create.mockResolvedValue(mockUser)
			mockUserRepository.linkOAuthProvider.mockResolvedValue(mockOAuthUser)
			mockUserRepository.update.mockResolvedValue(mockUser)

			// Act
			const result = await controller.socialLogin('google', { token: 'valid_token' })

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
						displayName: undefined,
						autobiography: undefined,
						backgroundImage: undefined,
						isFollowing: undefined,
						links: undefined,
						followersCount: 0,
						followingCount: 0
					}
				}
			})
			expect(mockUserRepository.create).toHaveBeenCalledWith({
				username: 'Test User',
				email: 'test@example.com',
				password: 'hashed_random_password_123'
			})
			expect(mockUserRepository.linkOAuthProvider).toHaveBeenCalledWith({
				userId: 'user-123',
				provider: 'google',
				email: 'test@example.com'
			})
		})

		it('should return PROVIDER_NOT_LINKED when user exists but no OAuth link', async () => {
			// Arrange
			mockAuthGateway.validateSocialLogin.mockResolvedValue({
				valid: true,
				userData: mockSocialData
			})
			mockUserRepository.findOAuthUser.mockResolvedValue(null)
			mockUserRepository.findByEmail.mockResolvedValue(mockUser)

			// Act
			const result = await controller.socialLogin('google', { token: 'valid_token' })

			// Assert
			expect(result).toBe('PROVIDER_NOT_LINKED')
			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith({ email: 'test@example.com' })
			expect(mockUserRepository.create).not.toHaveBeenCalled()
		})

		it('should return USER_NOT_FOUND for invalid token', async () => {
			// Arrange
			mockAuthGateway.validateSocialLogin.mockResolvedValue({
				valid: false,
				userData: null
			})

			// Act
			const result = await controller.socialLogin('google', { token: 'invalid_token' })

			// Assert
			expect(result).toBe('USER_NOT_FOUND')
			expect(mockAuthGateway.validateSocialLogin).toHaveBeenCalledWith({
				provider: 'google',
				token: 'invalid_token'
			})
		})

		it('should update refresh token in database', async () => {
			// Arrange
			mockAuthGateway.validateSocialLogin.mockResolvedValue({
				valid: true,
				userData: mockSocialData
			})
			mockUserRepository.findOAuthUser.mockResolvedValue(mockOAuthUser)
			mockUserRepository.update.mockResolvedValue(mockUser)

			// Act
			await controller.socialLogin('google', { token: 'valid_token' })

			// Assert
			expect(mockUserRepository.update).toHaveBeenCalledWith({ 
				id: 'user-123', 
				token: 'jwt_token_user-123' 
			})
		})
	})

	describe('linkNewOAuthProvider', () => {
		it('should link new OAuth provider successfully', async () => {
			// Arrange
			mockAuthGateway.validateSocialLogin.mockResolvedValue({
				valid: true,
				userData: mockSocialData
			})
			mockUserRepository.findById.mockResolvedValue(mockUser)
			mockUserRepository.findOAuthUser.mockResolvedValue(null)
			mockUserRepository.linkOAuthProvider.mockResolvedValue(mockOAuthUser)

			// Act
			const result = await controller.linkNewOAuthProvider(
				'linkedin',
				{ token: 'valid_token' },
				mockRequest as any
			)

			// Assert
			expect(result).toEqual({ success: true })
			expect(mockAuthGateway.validateSocialLogin).toHaveBeenCalledWith({
				provider: 'linkedin',
				token: 'valid_token'
			})
			expect(mockUserRepository.linkOAuthProvider).toHaveBeenCalledWith({
				userId: 'user-123',
				provider: 'linkedin',
				email: 'test@example.com'
			})
		})

		it('should return PROVIDER_ALREADY_LINKED when provider already linked', async () => {
			// Arrange
			mockAuthGateway.validateSocialLogin.mockResolvedValue({
				valid: true,
				userData: mockSocialData
			})
			mockUserRepository.findById.mockResolvedValue(mockUser)
			mockUserRepository.findOAuthUser.mockResolvedValue(mockOAuthUser)

			// Act
			const result = await controller.linkNewOAuthProvider(
				'linkedin',
				{ token: 'valid_token' },
				mockRequest as any
			)

			// Assert
			expect(result).toBe('PROVIDER_ALREADY_LINKED')
			expect(mockUserRepository.linkOAuthProvider).not.toHaveBeenCalled()
		})

		it('should return USER_NOT_FOUND when user does not exist', async () => {
			// Arrange
			mockAuthGateway.validateSocialLogin.mockResolvedValue({
				valid: true,
				userData: mockSocialData
			})
			mockUserRepository.findById.mockResolvedValue(null)

			// Act
			const result = await controller.linkNewOAuthProvider(
				'linkedin',
				{ token: 'valid_token' },
				mockRequest as any
			)

			// Assert
			expect(result).toBe('USER_NOT_FOUND')
			expect(mockUserRepository.linkOAuthProvider).not.toHaveBeenCalled()
		})

		it('should return USER_NOT_FOUND for invalid token', async () => {
			// Arrange
			mockAuthGateway.validateSocialLogin.mockResolvedValue({
				valid: false,
				userData: null
			})

			// Act
			const result = await controller.linkNewOAuthProvider(
				'linkedin',
				{ token: 'invalid_token' },
				mockRequest as any
			)

			// Assert
			expect(result).toBe('USER_NOT_FOUND')
		})
	})

	describe('callbackSocialLoginGet', () => {
		it('should redirect with error when callback fails', async () => {
			// Arrange
			const mockResponse = { redirect: jest.fn() }
			const mockRequest = { res: mockResponse }

			// Act
			await controller.callbackSocialLoginGet('google', mockRequest as any, 'code', 'state')

			// Assert
			expect(mockResponse.redirect).toHaveBeenCalledWith(
				'com.gamix://auth/loading?provider=google&error=LOGIN_WITH_GOOGLE_FAILED'
			)
		})
	})
})

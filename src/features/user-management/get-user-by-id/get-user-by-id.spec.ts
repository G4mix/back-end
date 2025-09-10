import { GetUserByIdController } from './get-user-by-id.controller'

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

describe('GetUserByIdController', () => {
	let controller: GetUserByIdController
	let mockUserRepository: any
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

		// Mock completo do Logger
		mockLogger = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn(),
			log: jest.fn()
		}

		controller = new GetUserByIdController(mockUserRepository, mockLogger)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('getUserById', () => {
		it('should return user when found', async () => {
			// Arrange
			const userId = 'user-123'
			const mockUser = {
				id: userId,
				username: 'john_doe',
				email: 'john@example.com',
				verified: true,
				created_at: new Date('2023-01-01'),
				updated_at: new Date('2023-01-01'),
				userProfile: {
					id: 'profile-123',
					icon: 'icon-url',
					displayName: 'John Doe',
					autobiography: 'Software developer',
					backgroundImage: 'bg-url',
					isFollowing: false,
					links: ['https://github.com/john'],
					_count: { followers: 5, following: 10 }
				}
			}
			mockUserRepository.findById.mockResolvedValue(mockUser)

			// Act
			const result = await controller.getUserById(userId)

			// Assert
			expect(result).toEqual({
				user: {
					id: userId,
					username: 'john_doe',
					email: 'john@example.com',
					verified: true,
					created_at: expect.any(Date),
					updated_at: expect.any(Date),
					userProfile: {
						id: 'profile-123',
						icon: 'icon-url',
						displayName: 'John Doe',
						autobiography: 'Software developer',
						backgroundImage: 'bg-url',
						isFollowing: false,
						links: ['https://github.com/john'],
						_count: {
							followers: 5,
							following: 10,
						}
					}
				}
			})
			expect(mockUserRepository.findById).toHaveBeenCalledWith({ id: userId })
		})

		it('should return 404 when user not found', async () => {
			// Arrange
			const userId = 'non-existent-user'
			mockUserRepository.findById.mockResolvedValue(null)

			// Act
			const result = await controller.getUserById(userId)

			// Assert
			expect(result).toEqual({
				message: 'USER_NOT_FOUND'
			})
			expect(mockUserRepository.findById).toHaveBeenCalledWith({ id: userId })
		})

		it('should handle repository errors', async () => {
			// Arrange
			const userId = 'user-123'
			const error = new Error('Database connection failed')
			mockUserRepository.findById.mockRejectedValue(error)

			// Act & Assert
			await expect(controller.getUserById(userId)).rejects.toThrow('Database connection failed')
		})

		it('should handle user without profile', async () => {
			// Arrange
			const userId = 'user-123'
			const mockUser = {
				id: userId,
				username: 'john_doe',
				email: 'john@example.com',
				verified: true,
				created_at: new Date('2023-01-01'),
				updated_at: new Date('2023-01-01'),
				userProfile: {
					id: 'profile-123',
					icon: null,
					displayName: 'John Doe',
					autobiography: 'Software developer',
					backgroundImage: null,
					isFollowing: false,
					links: [],
					_count: { followers: 0, following: 0 }
				}
			}
			mockUserRepository.findById.mockResolvedValue(mockUser)

			// Act
			const result = await controller.getUserById(userId)

			// Assert
			expect(result).toEqual({
				user: {
					id: userId,
					username: 'john_doe',
					email: 'john@example.com',
					verified: true,
					created_at: expect.any(Date),
					updated_at: expect.any(Date),
					userProfile: {
						id: 'profile-123',
						icon: null,
						displayName: 'John Doe',
						autobiography: 'Software developer',
						backgroundImage: null,
						isFollowing: false,
						links: [],
						_count: {
							followers: 0,
							following: 0,
						}
					}
				}
			})
		})
	})
})

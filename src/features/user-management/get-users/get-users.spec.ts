import { GetUsersController } from './get-users.controller'

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

describe('GetUsersController', () => {
	let controller: GetUsersController
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

		controller = new GetUsersController(mockUserRepository, mockLogger)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('getUsers', () => {
		it('should return users with default pagination', async () => {
			// Arrange
			const mockUsers = {
				data: [
					{
						id: 'user-1',
						username: 'john_doe',
						email: 'john@example.com',
						verified: true,
						created_at: new Date('2023-01-01'),
						updated_at: new Date('2023-01-01'),
						userProfile: {
							id: 'profile-1',
							icon: null,
							displayName: 'John Doe',
							autobiography: 'Software developer',
							backgroundImage: null,
							isFollowing: false,
							links: [],
							_count: { followers: 5, following: 10 }
						}
					}
				],
				total: 1
			}
			mockUserRepository.findAll.mockResolvedValue(mockUsers)

			// Act
			const result = await controller.getUsers()

			// Assert
			expect(result).toEqual({
				users: {
					data: [
						{
							id: 'user-1',
							username: 'john_doe',
							email: 'john@example.com',
							verified: true,
							created_at: expect.any(Date),
							updated_at: expect.any(Date),
							userProfile: {
								id: 'profile-1',
								icon: null,
								displayName: 'John Doe',
								autobiography: 'Software developer',
								backgroundImage: null,
								isFollowing: false,
								links: [],
								_count: {
									followers: 5,
									following: 10,
								}
							}
						}
					],
					total: 1
				},
				pagination: {
					page: 0,
					limit: 10,
					total: 1
				}
			})
			expect(mockUserRepository.findAll).toHaveBeenCalledWith({
				page: 0,
				quantity: 10,
				search: '',
				userId: ''
			})
		})

		it('should return users with custom pagination', async () => {
			// Arrange
			const mockUsers = {
				data: [],
				total: 0
			}
			mockUserRepository.findAll.mockResolvedValue(mockUsers)

			// Act
			const result = await controller.getUsers(2, 5)

			// Assert
			expect(result).toEqual({
				users: {
					data: [],
					total: 0
				},
				pagination: {
					page: 2,
					limit: 5,
					total: 0
				}
			})
			expect(mockUserRepository.findAll).toHaveBeenCalledWith({
				page: 2,
				quantity: 5,
				search: '',
				userId: ''
			})
		})

		it('should return users with search term', async () => {
			// Arrange
			const mockUsers = {
				data: [],
				total: 0
			}
			mockUserRepository.findAll.mockResolvedValue(mockUsers)

			// Act
			const result = await controller.getUsers(0, 10, 'john')

			// Assert
			expect(result).toEqual({
				users: {
					data: [],
					total: 0
				},
				pagination: {
					page: 0,
					limit: 10,
					total: 0
				}
			})
			expect(mockUserRepository.findAll).toHaveBeenCalledWith({
				page: 0,
				quantity: 10,
				search: 'john',
				userId: ''
			})
		})

		it('should handle repository errors', async () => {
			// Arrange
			const error = new Error('Database connection failed')
			mockUserRepository.findAll.mockRejectedValue(error)

			// Act & Assert
			await expect(controller.getUsers()).rejects.toThrow('Database connection failed')
		})
	})
})

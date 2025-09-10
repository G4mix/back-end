import { DeleteUserController } from './delete-user.controller'

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

// Mock do UserGateway
jest.mock('@shared/gateways/user.gateway', () => ({
	UserGateway: jest.fn().mockImplementation(() => ({
		uploadUserIcon: jest.fn(),
		uploadUserBackground: jest.fn(),
		deleteUserFile: jest.fn()
	}))
}))

describe('DeleteUserController', () => {
	let controller: DeleteUserController
	let mockUserRepository: any
	let mockUserGateway: any
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

		// Mock completo do UserGateway
		mockUserGateway = {
			uploadUserIcon: jest.fn(),
			uploadUserBackground: jest.fn(),
			deleteUserFile: jest.fn()
		}

		// Mock completo do Logger
		mockLogger = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn(),
			log: jest.fn()
		}

		controller = new DeleteUserController(mockUserRepository, mockUserGateway, mockLogger)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('deleteUser', () => {
		it('should delete user successfully when user owns the account', async () => {
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
					icon: 'icon-key',
					backgroundImage: 'bg-key'
				}
			}

			const mockRequest = {
				user: { sub: userId }
			}

			mockUserRepository.findById.mockResolvedValue(mockUser)
			mockUserGateway.deleteUserFile.mockResolvedValue(true)
			mockUserRepository.delete.mockResolvedValue(true)

			// Act
			const result = await controller.deleteUser(mockRequest as any)

			// Assert
			expect(result).toEqual({
				message: 'USER_DELETED_SUCCESSFULLY'
			})
			expect(mockUserRepository.findById).toHaveBeenCalledWith({ id: userId })
			expect(mockUserGateway.deleteUserFile).toHaveBeenCalledWith({ key: 'icon-key' })
			expect(mockUserGateway.deleteUserFile).toHaveBeenCalledWith({ key: 'bg-key' })
			expect(mockUserRepository.delete).toHaveBeenCalledWith({ id: userId })
		})

		it('should return USER_NOT_FOUND when user does not exist', async () => {
			// Arrange
			const nonExistentUserId = 'non-existent-user'
			const mockRequest = {
				user: { sub: nonExistentUserId }
			}

			// Act
			const result = await controller.deleteUser(mockRequest as any)

			// Assert
			expect(result).toEqual({
				message: 'USER_NOT_FOUND'
			})
			expect(mockUserRepository.findById).toHaveBeenCalledWith({ id: nonExistentUserId })
			expect(mockUserGateway.deleteUserFile).not.toHaveBeenCalled()
			expect(mockUserRepository.delete).not.toHaveBeenCalled()
		})


		it('should handle user without profile images', async () => {
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
					backgroundImage: null
				}
			}

			const mockRequest = {
				user: { sub: userId }
			}

			mockUserRepository.findById.mockResolvedValue(mockUser)
			mockUserRepository.delete.mockResolvedValue(true)

			// Act
			const result = await controller.deleteUser(mockRequest as any)

			// Assert
			expect(result).toEqual({
				message: 'USER_DELETED_SUCCESSFULLY'
			})
			expect(mockUserGateway.deleteUserFile).not.toHaveBeenCalled()
			expect(mockUserRepository.delete).toHaveBeenCalledWith({ id: userId })
		})

		it('should handle gateway errors gracefully', async () => {
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
					icon: 'icon-key',
					backgroundImage: 'bg-key'
				}
			}

			const mockRequest = {
				user: { sub: userId }
			}

			mockUserRepository.findById.mockResolvedValue(mockUser)
			mockUserGateway.deleteUserFile.mockRejectedValue(new Error('S3 Error'))
			mockUserRepository.delete.mockResolvedValue(true)

			// Act & Assert
			await expect(controller.deleteUser(mockRequest as any)).rejects.toThrow('S3 Error')
		})

		it('should handle repository errors', async () => {
			// Arrange
			const userId = 'user-123'
			const mockRequest = {
				user: { sub: userId }
			}

			mockUserRepository.findById.mockRejectedValue(new Error('Database Error'))

			// Act & Assert
			await expect(controller.deleteUser(mockRequest as any)).rejects.toThrow('Database Error')
		})
	})
})

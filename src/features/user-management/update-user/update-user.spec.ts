import { UpdateUserController } from './update-user.controller'
import { Readable } from 'stream'

// Mock de Readable stream
const mockStream = new Readable({
	read() {
		this.push('fake-stream-data')
		this.push(null)
	}
})

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

jest.mock('@shared/utils', () => ({
	BCryptEncoder: {
		encode: jest.fn(),
		compare: jest.fn()
	}
}))

// Mock das constantes
jest.mock('@shared/constants', () => ({
	MAX_SIZE: 5 * 1024 * 1024, // 5MB
	SUPPORTED_IMAGES: {
		'image/jpeg': '.jpg',
		'image/png': '.png',
		'image/webp': '.webp'
	}
}))

describe('UpdateUserController', () => {
	let controller: UpdateUserController
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

		controller = new UpdateUserController(mockUserRepository, mockUserGateway, mockLogger)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('updateUser', () => {
		it('should update user basic information successfully', async () => {
			// Arrange
			const userId = 'user-123'
			const updateInput = {
				username: 'john_updated',
				email: 'john.updated@example.com',
				displayName: 'John Updated',
				autobiography: 'Updated bio'
			}

			const mockCurrentUser = {
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
					autobiography: 'Old bio',
					backgroundImage: null,
					isFollowing: false,
					links: [],
					_count: { followers: 5, following: 10 }
				}
			}

			const mockUpdatedUser = {
				...mockCurrentUser,
				username: 'john_updated',
				email: 'john.updated@example.com',
				userProfile: {
					...mockCurrentUser.userProfile,
					displayName: 'John Updated',
					autobiography: 'Updated bio'
				}
			}

			const mockRequest = {
				user: { sub: userId }
			}

			mockUserRepository.findById.mockResolvedValue(mockCurrentUser)
			mockUserRepository.update.mockResolvedValue(mockUpdatedUser)

			// Act
			const result = await controller.updateUser(updateInput, mockRequest as any)

			// Assert
			expect(result).toEqual({
				user: {
					id: userId,
					username: 'john_updated',
					email: 'john.updated@example.com',
					verified: true,
					created_at: '2023-01-01T00:00:00.000Z',
					updated_at: '2023-01-01T00:00:00.000Z',
					userProfile: {
						id: 'profile-123',
						icon: null,
						displayName: 'John Updated',
						autobiography: 'Updated bio',
						backgroundImage: null,
						isFollowing: false,
						links: [],
						followersCount: 5,
						followingCount: 10
					}
				}
			})
			expect(mockUserRepository.update).toHaveBeenCalledWith({
				id: userId,
				username: 'john_updated',
				email: 'john.updated@example.com',
				displayName: 'John Updated',
				autobiography: 'Updated bio'
			})
		})

		it('should update user password successfully', async () => {
			// Arrange
			const userId = 'user-123'
			const updateInput = {
				password: 'NewPassword123!'
			}

			const mockCurrentUser = {
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
					autobiography: 'Bio',
					backgroundImage: null,
					isFollowing: false,
					links: [],
					_count: { followers: 5, following: 10 }
				}
			}

			const mockRequest = {
				user: { sub: userId }
			}

			mockUserRepository.findById.mockResolvedValue(mockCurrentUser)
			mockUserRepository.update.mockResolvedValue(mockCurrentUser)
			const { BCryptEncoder } = jest.requireMock('@shared/utils')
			BCryptEncoder.encode.mockReturnValue('hashed_new_password')

			// Act
			const result = await controller.updateUser(updateInput, mockRequest as any)

			// Assert
			expect(result).toBeDefined()
			expect(mockUserRepository.update).toHaveBeenCalledWith({
				id: userId,
				password: 'hashed_new_password'
			})
		})

		it('should upload user icon successfully', async () => {
			// Arrange
			const userId = 'user-123'
			const updateInput = {
				icon: {
					fieldname: 'icon',
					originalname: 'test.jpg',
					encoding: '7bit',
					mimetype: 'image/jpeg',
					size: 1024 * 1024, // 1MB
					buffer: Buffer.from('fake-image-data'),
					stream: mockStream,
					destination: '',
					filename: 'test.jpg',
					path: '/tmp/test.jpg'
				}
			}

			const mockCurrentUser = {
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
					autobiography: 'Bio',
					backgroundImage: null,
					isFollowing: false,
					links: [],
					_count: { followers: 5, following: 10 }
				}
			}

			const mockRequest = {
				user: { sub: userId }
			}

			mockUserRepository.findById.mockResolvedValue(mockCurrentUser)
			mockUserGateway.uploadUserIcon.mockResolvedValue({ key: 'new-icon-key', url: 'https://example.com/new-icon-key' })
			mockUserRepository.update.mockResolvedValue({
				...mockCurrentUser,
				userProfile: {
					...mockCurrentUser.userProfile,
					icon: 'new-icon-key'
				}
			})

			// Act
			const result = await controller.updateUser(updateInput, mockRequest as any)

			// Assert
			expect(result).toBeDefined()
			expect(mockUserGateway.uploadUserIcon).toHaveBeenCalledWith({ file: updateInput.icon })
			expect(mockUserRepository.update).toHaveBeenCalledWith({
				id: userId,
				icon: { key: 'new-icon-key', url: 'https://example.com/new-icon-key' }
			})
		})

		it('should throw error when file is too large', async () => {
			// Arrange
			const userId = 'user-123'
			const updateInput = {
				icon: {
					fieldname: 'icon',
					originalname: 'test.jpg',
					encoding: '7bit',
					mimetype: 'image/jpeg',
					size: 10 * 1024 * 1024, // 10MB (exceeds MAX_SIZE)
					buffer: Buffer.from('fake-image-data'),
					stream: mockStream,
					destination: '/tmp',
					filename: 'test.jpg',
					path: '/tmp/test.jpg'
				}
			}

			const mockRequest = {
				user: { sub: userId }
			}

			const mockCurrentUser = {
				id: userId,
				username: 'john_doe',
				email: 'john@example.com',
				userProfile: {
					id: 'profile-123',
					displayName: 'John Doe',
					autobiography: 'Test bio',
					icon: 'current-icon-key',
					backgroundImage: 'current-bg-key',
					links: [],
					_count: { followers: 5, following: 10 }
				}
			}

			mockUserRepository.findById.mockResolvedValue(mockCurrentUser)

			// Act & Assert
			await expect(controller.updateUser(updateInput, mockRequest as any)).rejects.toThrow('FILE_TOO_LARGE')
		})

		it('should throw error when file type is unsupported', async () => {
			// Arrange
			const userId = 'user-123'
			const updateInput = {
				icon: {
					fieldname: 'icon',
					originalname: 'test.gif',
					encoding: '7bit',
					mimetype: 'image/gif', // Unsupported type
					size: 1024 * 1024,
					buffer: Buffer.from('fake-image-data'),
					stream: mockStream,
					destination: '/tmp',
					filename: 'test.gif',
					path: '/tmp/test.gif'
				}
			}

			const mockRequest = {
				user: { sub: userId }
			}

			const mockCurrentUser = {
				id: userId,
				username: 'john_doe',
				email: 'john@example.com',
				userProfile: {
					id: 'profile-123',
					displayName: 'John Doe',
					autobiography: 'Test bio',
					icon: 'current-icon-key',
					backgroundImage: 'current-bg-key',
					links: [],
					_count: { followers: 5, following: 10 }
				}
			}

			mockUserRepository.findById.mockResolvedValue(mockCurrentUser)

			// Act & Assert
			await expect(controller.updateUser(updateInput, mockRequest as any)).rejects.toThrow('UNSUPPORTED_FILE_TYPE')
		})

		it('should return USER_NOT_FOUND when user does not exist', async () => {
			// Arrange
			const userId = 'non-existent-user'
			const updateInput = {
				username: 'new_username'
			}

			const mockRequest = {
				user: { sub: userId }
			}

			mockUserRepository.findById.mockResolvedValue(null)

			// Act
			const result = await controller.updateUser(updateInput, mockRequest as any)

			// Assert
			expect(result).toBe('USER_NOT_FOUND')
		})

		it('should handle gateway upload errors', async () => {
			// Arrange
			const userId = 'user-123'
			const updateInput = {
				icon: {
					fieldname: 'icon',
					originalname: 'test.jpg',
					encoding: '7bit',
					mimetype: 'image/jpeg',
					size: 1024 * 1024,
					buffer: Buffer.from('fake-image-data'),
					stream: mockStream,
					destination: '/tmp',
					filename: 'test.jpg',
					path: '/tmp/test.jpg'
				}
			}

			const mockCurrentUser = {
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
					autobiography: 'Bio',
					backgroundImage: null,
					isFollowing: false,
					links: [],
					_count: { followers: 5, following: 10 }
				}
			}

			const mockRequest = {
				user: { sub: userId }
			}

			mockUserRepository.findById.mockResolvedValue(mockCurrentUser)
			mockUserGateway.uploadUserIcon.mockResolvedValue('UPLOAD_ERROR')

			// Act & Assert
			await expect(controller.updateUser(updateInput, mockRequest as any)).rejects.toThrow('UPLOAD_ERROR')
		})

		it('should handle repository errors', async () => {
			// Arrange
			const userId = 'user-123'
			const updateInput = {
				username: 'new_username'
			}

			const mockRequest = {
				user: { sub: userId }
			}

			mockUserRepository.findById.mockRejectedValue(new Error('Database Error'))

			// Act & Assert
			await expect(controller.updateUser(updateInput, mockRequest as any)).rejects.toThrow('Database Error')
		})
	})
})

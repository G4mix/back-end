import { CreateIdeaController } from './create-idea.controller'

// Mock completo do Prisma Client
jest.mock('@prisma/client', () => ({
	PrismaClient: jest.fn().mockImplementation(() => ({
		idea: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
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

describe('CreateIdeaController', () => {
	let controller: CreateIdeaController
	let mockLogger: any
	let mockIdeaRepository: any

	beforeEach(() => {
		mockLogger = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn(),
			log: jest.fn()
		}

		mockIdeaRepository = {
			create: jest.fn(),
			findById: jest.fn(),
			findByTitle: jest.fn()
		}

		controller = new CreateIdeaController(mockLogger, mockIdeaRepository)
	})

	describe('createIdea', () => {
		it('should create idea successfully', async () => {
			// Arrange
			const ideaData = {
				title: 'Revolutionary Mobile App Idea',
				description: 'A detailed description of the mobile app concept that will revolutionize the way people interact with technology. This app will provide innovative features and user experience improvements.'
			}

			const mockRequest = {
				user: { sub: 'user-profile-123' }
			}

			const mockCreatedIdea = {
				id: 'idea-uuid-123',
				title: ideaData.title,
				description: ideaData.description,
				authorId: mockRequest.user.sub,
				created_at: new Date(),
				updated_at: new Date()
			}

			mockIdeaRepository.findByTitle.mockResolvedValue(null)
			mockIdeaRepository.create.mockResolvedValue(mockCreatedIdea)

			// Act
			const result = await controller.createIdea(ideaData, mockRequest)

			// Assert
			expect(result).toEqual({
				idea: {
					id: 'idea-uuid-123',
					title: 'Revolutionary Mobile App Idea',
					description: 'A detailed description of the mobile app concept that will revolutionize the way people interact with technology. This app will provide innovative features and user experience improvements.',
					authorId: 'user-profile-123',
					created_at: expect.any(String),
					updated_at: expect.any(String)
				}
			})
			expect(mockLogger.info).toHaveBeenCalledWith('Creating new idea', {
				userId: 'user-profile-123',
				title: 'Revolutionary Mobile App Idea',
				descriptionLength: 189
			})
			expect(mockLogger.info).toHaveBeenCalledWith('Idea created successfully', {
				ideaId: 'idea-uuid-123',
				userId: 'user-profile-123'
			})
		})

		it('should create idea with minimal required fields', async () => {
			// Arrange
			const ideaData = {
				title: 'Simple Idea Title',
				description: 'A detailed description of the simple idea that meets the minimum requirements for creating an idea in the system.'
			}

			const mockRequest = {
				user: { sub: 'user-profile-456' }
			}

			const mockCreatedIdea = {
				id: 'idea-uuid-123',
				title: ideaData.title,
				description: ideaData.description,
				authorId: mockRequest.user.sub,
				created_at: new Date(),
				updated_at: new Date()
			}

			mockIdeaRepository.findByTitle.mockResolvedValue(null)
			mockIdeaRepository.create.mockResolvedValue(mockCreatedIdea)

			// Act
			const result = await controller.createIdea(ideaData, mockRequest)

			// Assert
			expect(result).toEqual({
				idea: {
					id: 'idea-uuid-123',
					title: 'Simple Idea Title',
					description: 'A detailed description of the simple idea that meets the minimum requirements for creating an idea in the system.',
					authorId: 'user-profile-456',
					created_at: expect.any(String),
					updated_at: expect.any(String)
				}
			})
		})

		it('should return UNAUTHORIZED when user is not authenticated', async () => {
			// Arrange
			const ideaData = {
				title: 'Test Idea',
				description: 'Test description for the idea'
			}

			const mockRequest = {
				user: null
			}

			// Act
			const result = await controller.createIdea(ideaData, mockRequest)

			// Assert
			expect(result).toBe('UNAUTHORIZED')
			expect(mockLogger.info).toHaveBeenCalledWith('Starting createIdea', expect.any(Object))
			expect(mockLogger.info).toHaveBeenCalledWith('Finished createIdea. Response time: 0ms')
		})

		it('should return UNAUTHORIZED when user sub is missing', async () => {
			// Arrange
			const ideaData = {
				title: 'Test Idea',
				description: 'Test description for the idea'
			}

			const mockRequest = {
				user: {}
			}

			// Act
			const result = await controller.createIdea(ideaData, mockRequest)

			// Assert
			expect(result).toBe('UNAUTHORIZED')
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const ideaData = {
				title: 'Test Idea',
				description: 'Test description for the idea'
			}

			const mockRequest = {
				user: { sub: 'user-profile-123' }
			}

			// Mock repository to throw error
			mockIdeaRepository.findByTitle.mockRejectedValue(new Error('Database connection failed'))

			// Act
			const result = await controller.createIdea(ideaData, mockRequest)

			// Assert
			expect(result).toBe('Failed to create idea')
			expect(mockLogger.error).toHaveBeenCalledWith('Failed to create idea', {
				error: 'Database connection failed',
				userId: 'user-profile-123'
			})
		})

		it('should handle unknown errors gracefully', async () => {
			// Arrange
			const ideaData = {
				title: 'Test Idea',
				description: 'Test description for the idea'
			}

			const mockRequest = {
				user: { sub: 'user-profile-123' }
			}

			// Mock repository to throw unknown error
			mockIdeaRepository.findByTitle.mockRejectedValue('Unknown error type')

			// Act
			const result = await controller.createIdea(ideaData, mockRequest)

			// Assert
			expect(result).toBe('Failed to create idea')
			expect(mockLogger.error).toHaveBeenCalledWith('Failed to create idea', {
				error: 'Unknown error',
				userId: 'user-profile-123'
			})
		})

		it('should log appropriate information for idea creation', async () => {
			// Arrange
			const ideaData = {
				title: 'Logging Test Idea',
				description: 'This is a test description for logging purposes to verify that all logging statements work correctly.'
			}

			const mockRequest = {
				user: { sub: 'user-profile-789' }
			}

			const mockCreatedIdea = {
				id: 'idea-uuid-123',
				title: ideaData.title,
				description: ideaData.description,
				authorId: mockRequest.user.sub,
				created_at: new Date(),
				updated_at: new Date()
			}

			mockIdeaRepository.findByTitle.mockResolvedValue(null)
			mockIdeaRepository.create.mockResolvedValue(mockCreatedIdea)

			// Act
			await controller.createIdea(ideaData, mockRequest)

			// Assert
			expect(mockLogger.info).toHaveBeenCalledWith('Creating new idea', {
				userId: 'user-profile-789',
				title: 'Logging Test Idea',
				descriptionLength: 101
			})
			expect(mockLogger.info).toHaveBeenCalledWith('Idea created successfully', {
				ideaId: 'idea-uuid-123',
				userId: 'user-profile-789'
			})
		})
	})
})

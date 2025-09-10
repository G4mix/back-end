import { GetIdeaByIdController } from './get-idea-by-id.controller'

jest.mock('@shared/utils/logger', () => ({
	Logger: jest.fn().mockImplementation(() => ({
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
		debug: jest.fn(),
		log: jest.fn()
	}))
}))

jest.mock('@shared/decorators', () => ({
	LogResponseTime: () => (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => descriptor
}))

describe('GetIdeaByIdController', () => {
	let controller: GetIdeaByIdController
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
			findById: jest.fn()
		}

		controller = new GetIdeaByIdController(mockLogger, mockIdeaRepository)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('getIdeaById', () => {
		it('should retrieve idea successfully', async () => {
			// Arrange
			const ideaId = 'idea-uuid-123'
			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			const mockIdea = {
				id: ideaId,
				title: 'Revolutionary Mobile App',
				description: 'A detailed description of the mobile app concept...',
				authorId: 'user-profile-456',
				author: {
					id: 'user-profile-456',
					displayName: 'John Doe',
					icon: 'https://example.com/icon.jpg'
				},
				created_at: new Date(),
				updated_at: new Date(),
				_count: {
					likes: 15,
					views: 120,
					comments: 8
				}
			}

			mockIdeaRepository.findById.mockResolvedValue(mockIdea)

			// Act
			const result = await controller.getIdeaById(ideaId, mockRequest)

			// Assert
			expect(result).toEqual({
				idea: {
					...mockIdea,
					created_at: expect.any(String),
					updated_at: expect.any(String)
				}
			})
			expect(mockLogger.info).toHaveBeenCalledWith('Retrieving idea by ID', {
				userProfileId: 'user-profile-123',
				ideaId: ideaId
			})
			expect(mockLogger.info).toHaveBeenCalledWith('Idea retrieved successfully', {
				userProfileId: 'user-profile-123',
				ideaId: ideaId,
				title: mockIdea.title
			})
		})

		it('should return IDEA_NOT_FOUND when idea does not exist', async () => {
			// Arrange
			const ideaId = 'idea-inexistente'
			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			mockIdeaRepository.findById.mockResolvedValue(null)

			// Act
			const result = await controller.getIdeaById(ideaId, mockRequest)

			// Assert
			expect(result).toBe('IDEA_NOT_FOUND')
			expect(mockLogger.info).toHaveBeenCalledWith('Retrieving idea by ID', {
				userProfileId: 'user-profile-123',
				ideaId: ideaId
			})
		})

		it('should return UNAUTHORIZED when user is not authenticated', async () => {
			// Arrange
			const ideaId = 'idea-uuid-123'
			const mockRequest = {}

			// Act
			const result = await controller.getIdeaById(ideaId, mockRequest)

			// Assert
			expect(result).toBe('UNAUTHORIZED')
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const ideaId = 'idea-uuid-123'
			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			mockIdeaRepository.findById.mockRejectedValue(new Error('Database connection failed'))

			// Act
			const result = await controller.getIdeaById(ideaId, mockRequest)

			// Assert
			expect(result).toBe('Failed to retrieve idea')
			expect(mockLogger.error).toHaveBeenCalledWith('Failed to retrieve idea', {
				error: 'Database connection failed',
				userProfileId: 'user-profile-123',
				ideaId: ideaId
			})
		})
	})
})

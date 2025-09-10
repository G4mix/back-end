import { UpdateIdeaController } from './update-idea.controller'

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

describe('UpdateIdeaController', () => {
	let controller: UpdateIdeaController
	let mockLogger: any
	let mockIdeaRepository: any
	let mockIdeaGateway: any

	beforeEach(() => {
		mockLogger = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn(),
			log: jest.fn()
		}

		mockIdeaRepository = {
			findById: jest.fn(),
			update: jest.fn()
		}

		mockIdeaGateway = {
			uploadIdeaImages: jest.fn(),
			deleteIdeaImages: jest.fn()
		}

		controller = new UpdateIdeaController(mockLogger, mockIdeaRepository, mockIdeaGateway)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('updateIdea', () => {
		it('should update idea successfully', async () => {
			// Arrange
			const ideaId = 'idea-uuid-123'
			const updateData = {
				title: 'Updated Mobile App Idea',
				description: 'An updated description of the mobile app concept...'
			}
			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			const existingIdea = {
				id: ideaId,
				title: 'Original Title',
				description: 'Original Description',
				authorId: 'user-profile-123',
				created_at: new Date(),
				updated_at: new Date()
			}

			const updatedIdea = {
				...existingIdea,
				...updateData,
				updated_at: new Date()
			}

			mockIdeaRepository.findById.mockResolvedValue(existingIdea)
			mockIdeaRepository.update.mockResolvedValue(updatedIdea)

			// Act
			const result = await controller.updateIdea(ideaId, updateData, mockRequest)

			// Assert
			expect(result).toEqual({
				idea: {
					...updatedIdea,
					created_at: expect.any(String),
					updated_at: expect.any(String)
				}
			})
			expect(mockLogger.info).toHaveBeenCalledWith('Updating idea', {
				userProfileId: 'user-profile-123',
				ideaId: ideaId,
				title: updateData.title,
				descriptionLength: updateData.description?.length
			})
			expect(mockLogger.info).toHaveBeenCalledWith('Idea updated successfully', {
				ideaId: ideaId,
				userProfileId: 'user-profile-123'
			})
		})

		it('should return FORBIDDEN when user is not the author', async () => {
			// Arrange
			const ideaId = 'idea-uuid-123'
			const updateData = {
				title: 'Updated Title'
			}
			const mockRequest = {
				user: { userProfileId: 'user-profile-456' }
			}

			const existingIdea = {
				id: ideaId,
				title: 'Original Title',
				description: 'Original Description',
				authorId: 'user-profile-123', // Different author
				created_at: new Date(),
				updated_at: new Date()
			}

			mockIdeaRepository.findById.mockResolvedValue(existingIdea)

			// Act
			const result = await controller.updateIdea(ideaId, updateData, mockRequest)

			// Assert
			expect(result).toBe('FORBIDDEN')
			expect(mockLogger.info).toHaveBeenCalledWith('Updating idea', {
				userProfileId: 'user-profile-456',
				ideaId: ideaId,
				title: updateData.title,
				descriptionLength: undefined
			})
		})

		it('should return IDEA_NOT_FOUND when idea does not exist', async () => {
			// Arrange
			const ideaId = 'idea-inexistente'
			const updateData = {
				title: 'Updated Title'
			}
			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			mockIdeaRepository.findById.mockResolvedValue(null)

			// Act
			const result = await controller.updateIdea(ideaId, updateData, mockRequest)

			// Assert
			expect(result).toBe('IDEA_NOT_FOUND')
			expect(mockLogger.info).toHaveBeenCalledWith('Updating idea', {
				userProfileId: 'user-profile-123',
				ideaId: ideaId,
				title: updateData.title,
				descriptionLength: undefined
			})
		})

		it('should return UNAUTHORIZED when user is not authenticated', async () => {
			// Arrange
			const ideaId = 'idea-uuid-123'
			const updateData = {
				title: 'Updated Title'
			}
			const mockRequest = {}

			// Act
			const result = await controller.updateIdea(ideaId, updateData, mockRequest)

			// Assert
			expect(result).toBe('UNAUTHORIZED')
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const ideaId = 'idea-uuid-123'
			const updateData = {
				title: 'Updated Title'
			}
			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			mockIdeaRepository.findById.mockRejectedValue(new Error('Database connection failed'))

			// Act
			const result = await controller.updateIdea(ideaId, updateData, mockRequest)

			// Assert
			expect(result).toBe('Failed to update idea')
			expect(mockLogger.error).toHaveBeenCalledWith('Failed to update idea', {
				error: 'Database connection failed',
				userProfileId: 'user-profile-123',
				ideaId: ideaId
			})
		})
	})
})

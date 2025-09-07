import { DeleteIdeaController } from './delete-idea.controller'

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

describe('DeleteIdeaController', () => {
	let controller: DeleteIdeaController
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
			findById: jest.fn(),
			delete: jest.fn()
		}

		controller = new DeleteIdeaController(mockLogger, mockIdeaRepository)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('deleteIdea', () => {
		it('should delete idea successfully', async () => {
			// Arrange
			const ideaId = 'idea-uuid-123'
			const mockRequest = {
				user: { sub: 'user-profile-123' }
			}

			const existingIdea = {
				id: ideaId,
				title: 'Test Idea',
				description: 'Test Description',
				authorId: 'user-profile-123',
				created_at: new Date(),
				updated_at: new Date()
			}

			mockIdeaRepository.findById.mockResolvedValue(existingIdea)
			mockIdeaRepository.delete.mockResolvedValue(undefined)

			// Act
			const result = await controller.deleteIdea(ideaId, mockRequest)

			// Assert
			expect(result).toBe('Idea deleted successfully')
			expect(mockLogger.info).toHaveBeenCalledWith('Deleting idea', {
				userId: 'user-profile-123',
				ideaId: ideaId
			})
			expect(mockLogger.info).toHaveBeenCalledWith('Idea deleted successfully', {
				ideaId: ideaId,
				userId: 'user-profile-123'
			})
			expect(mockIdeaRepository.delete).toHaveBeenCalledWith(ideaId)
		})

		it('should return FORBIDDEN when user is not the author', async () => {
			// Arrange
			const ideaId = 'idea-uuid-123'
			const mockRequest = {
				user: { sub: 'user-profile-456' }
			}

			const existingIdea = {
				id: ideaId,
				title: 'Test Idea',
				description: 'Test Description',
				authorId: 'user-profile-123', // Different author
				created_at: new Date(),
				updated_at: new Date()
			}

			mockIdeaRepository.findById.mockResolvedValue(existingIdea)

			// Act
			const result = await controller.deleteIdea(ideaId, mockRequest)

			// Assert
			expect(result).toBe('FORBIDDEN')
			expect(mockLogger.info).toHaveBeenCalledWith('Deleting idea', {
				userId: 'user-profile-456',
				ideaId: ideaId
			})
			expect(mockIdeaRepository.delete).not.toHaveBeenCalled()
		})

		it('should return IDEA_NOT_FOUND when idea does not exist', async () => {
			// Arrange
			const ideaId = 'idea-inexistente'
			const mockRequest = {
				user: { sub: 'user-profile-123' }
			}

			mockIdeaRepository.findById.mockResolvedValue(null)

			// Act
			const result = await controller.deleteIdea(ideaId, mockRequest)

			// Assert
			expect(result).toBe('IDEA_NOT_FOUND')
			expect(mockLogger.info).toHaveBeenCalledWith('Deleting idea', {
				userId: 'user-profile-123',
				ideaId: ideaId
			})
			expect(mockIdeaRepository.delete).not.toHaveBeenCalled()
		})

		it('should return UNAUTHORIZED when user is not authenticated', async () => {
			// Arrange
			const ideaId = 'idea-uuid-123'
			const mockRequest = {}

			// Act
			const result = await controller.deleteIdea(ideaId, mockRequest)

			// Assert
			expect(result).toBe('UNAUTHORIZED')
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const ideaId = 'idea-uuid-123'
			const mockRequest = {
				user: { sub: 'user-profile-123' }
			}

			mockIdeaRepository.findById.mockRejectedValue(new Error('Database connection failed'))

			// Act
			const result = await controller.deleteIdea(ideaId, mockRequest)

			// Assert
			expect(result).toBe('Failed to delete idea')
			expect(mockLogger.error).toHaveBeenCalledWith('Failed to delete idea', {
				error: 'Database connection failed',
				userId: 'user-profile-123',
				ideaId: ideaId
			})
		})
	})
})

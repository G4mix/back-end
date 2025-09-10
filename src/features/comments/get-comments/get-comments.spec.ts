import { GetCommentsController } from './get-comments.controller'

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

describe('GetCommentsController', () => {
	let controller: GetCommentsController
	let mockLogger: any
	let mockCommentRepository: any

	beforeEach(() => {
		mockLogger = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn(),
			log: jest.fn()
		}

		mockCommentRepository = {
			findByIdea: jest.fn()
		}

		controller = new GetCommentsController(mockLogger, mockCommentRepository)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('getComments', () => {
		it('should retrieve comments successfully', async () => {
			// Arrange
			const ideaId = 'idea-uuid-123'
			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			const mockComments = [
				{
					id: 'comment-uuid-1',
					content: 'This is a great idea!',
					ideaId: ideaId,
					parentCommentId: null,
					authorId: 'user-profile-456',
					author: {
						id: 'user-profile-456',
						displayName: 'John Doe',
						icon: 'https://example.com/icon.jpg'
					},
					created_at: new Date(),
					updated_at: new Date(),
					_count: {
						likes: 5,
						replies: 2
					}
				}
			]

			const total = 25
			mockCommentRepository.findByIdea.mockResolvedValue({ comments: mockComments, total })

			// Act
			const result = await controller.getComments(ideaId, 0, 10, undefined, mockRequest)

			// Assert
			expect(result).toEqual({
				comments: [
					{
						...mockComments[0],
						created_at: expect.any(String),
						updated_at: expect.any(String)
					}
				],
				pagination: {
					page: 0,
					limit: 10,
					total: 25,
					totalPages: 3,
					hasNext: true,
					hasPrev: false
				}
			})
			expect(mockLogger.info).toHaveBeenCalledWith('Retrieving comments', {
				userProfileId: 'user-profile-123',
				ideaId: ideaId,
				page: 0,
				limit: 10,
				parentCommentId: undefined
			})
			expect(mockLogger.info).toHaveBeenCalledWith('Comments retrieved successfully', {
				userProfileId: 'user-profile-123',
				count: 1,
				total: 25,
				page: 0
			})
		})

		it('should retrieve comments with pagination', async () => {
			// Arrange
			const ideaId = 'idea-uuid-123'
			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			const mockComments: any[] = []
			const total = 0
			mockCommentRepository.findByIdea.mockResolvedValue({ comments: mockComments, total })

			// Act
			const result = await controller.getComments(ideaId, 0, 5, undefined, mockRequest)

			// Assert
			expect(result).toEqual({
				comments: [],
				pagination: {
					page: 0,
					limit: 5,
					total: 0,
					totalPages: 0,
					hasNext: false,
					hasPrev: false
				}
			})
		})

		it('should retrieve replies for a specific comment', async () => {
			// Arrange
			const ideaId = 'idea-uuid-123'
			const parentCommentId = 'comment-uuid-456'
			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			const mockComments = [
				{
					id: 'reply-uuid-1',
					content: 'Thanks for the feedback!',
					ideaId: ideaId,
					parentCommentId: parentCommentId,
					authorId: 'user-profile-789',
					author: {
						id: 'user-profile-789',
						displayName: 'Jane Doe',
						icon: 'https://example.com/jane.jpg'
					},
					created_at: new Date(),
					updated_at: new Date(),
					_count: {
						likes: 2,
						replies: 0
					}
				}
			]

			const total = 1
			mockCommentRepository.findByIdea.mockResolvedValue({ comments: mockComments, total })

			// Act
			const result = await controller.getComments(ideaId, 0, 10, parentCommentId, mockRequest)

			// Assert
			expect(result).toEqual({
				comments: [
					{
						...mockComments[0],
						created_at: expect.any(String),
						updated_at: expect.any(String)
					}
				],
				pagination: {
					page: 0,
					limit: 10,
					total: 1,
					totalPages: 1,
					hasNext: false,
					hasPrev: false
				}
			})
		})

		it('should return UNAUTHORIZED when user is not authenticated', async () => {
			// Arrange
			const ideaId = 'idea-uuid-123'
			const mockRequest = {}

			// Act
			const result = await controller.getComments(ideaId, 0, 10, undefined, mockRequest)

			// Assert
			expect(result).toBe('UNAUTHORIZED')
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const ideaId = 'idea-uuid-123'
			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			mockCommentRepository.findByIdea.mockRejectedValue(new Error('Database connection failed'))

			// Act
			const result = await controller.getComments(ideaId, 0, 10, undefined, mockRequest)

			// Assert
			expect(result).toBe('Failed to retrieve comments')
			expect(mockLogger.error).toHaveBeenCalledWith('Failed to retrieve comments', {
				error: 'Database connection failed',
				userProfileId: 'user-profile-123'
			})
		})
	})
})

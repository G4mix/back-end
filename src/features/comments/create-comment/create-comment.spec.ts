import { CreateCommentController } from './create-comment.controller'

jest.mock('@shared/utils/logger', () => ({
	Logger: jest.fn().mockImplementation(() => ({
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
		debug: jest.fn(),
		log: jest.fn()
	}))
}))

describe('CreateCommentController', () => {
	let controller: CreateCommentController
	let mockLogger: any
	let mockCommentRepository: any
	let mockIdeaRepository: any

	beforeEach(() => {
		mockLogger = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn(),
			log: jest.fn()
		}

		mockCommentRepository = {
			create: jest.fn(),
			findById: jest.fn()
		}

		mockIdeaRepository = {
			findById: jest.fn()
		}

		controller = new CreateCommentController(mockLogger, mockCommentRepository, mockIdeaRepository)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('createComment', () => {
		it('should create a new comment successfully', async () => {
			// Arrange
			const commentData = {
				ideaId: 'idea-uuid-123',
				content: 'This is a great idea! I would love to contribute.',
				parentCommentId: undefined
			}
			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			const mockIdea = {
				id: 'idea-uuid-123',
				title: 'Test Idea',
				description: 'Test Description'
			}

			const mockCreatedComment = {
				id: 'comment-uuid-789',
				content: commentData.content,
				ideaId: commentData.ideaId,
				parentCommentId: null,
				authorId: mockRequest.user.userProfileId,
				author: {
					id: mockRequest.user.userProfileId,
					displayName: 'John Doe',
					icon: 'https://example.com/icon.jpg'
				},
				created_at: new Date(),
				updated_at: new Date(),
				_count: {
					likes: 0,
					replies: 0
				}
			}

			mockIdeaRepository.findById.mockResolvedValue(mockIdea)
			mockCommentRepository.create.mockResolvedValue(mockCreatedComment)

			// Act
			const result = await controller.createComment(commentData as any, mockRequest)

			// Assert
			expect(result).toEqual({
				comment: {
					id: 'comment-uuid-789',
					content: commentData.content,
					ideaId: commentData.ideaId,
					parentCommentId: null,
					authorId: 'user-profile-123',
					author: {
						id: 'user-profile-123',
						displayName: 'John Doe',
						icon: 'https://example.com/icon.jpg'
					},
					created_at: expect.any(Date),
					updated_at: expect.any(Date),
					_count: {
						likes: 0,
						replies: 0
					}
				}
			})
			expect(mockLogger.info).toHaveBeenCalledWith('Creating comment', {
				userProfileId: 'user-profile-123',
				ideaId: 'idea-uuid-123',
				parentCommentId: undefined,
				contentLength: commentData.content.length,
				isReply: false
			})
		})

		it('should create a reply comment successfully', async () => {
			// Arrange
			const commentData = {
				ideaId: 'idea-uuid-123',
				content: 'Thanks for the feedback!',
				parentCommentId: 'parent-comment-uuid-456'
			}
			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			const mockIdea = {
				id: 'idea-uuid-123',
				title: 'Test Idea',
				description: 'Test Description'
			}

			const mockParentComment = {
				id: 'parent-comment-uuid-456',
				content: 'Original comment',
				ideaId: 'idea-uuid-123'
			}

			const mockCreatedComment = {
				id: 'comment-uuid-789',
				content: commentData.content,
				ideaId: commentData.ideaId,
				parentCommentId: commentData.parentCommentId,
				authorId: mockRequest.user.userProfileId,
				author: {
					id: mockRequest.user.userProfileId,
					displayName: 'John Doe',
					icon: 'https://example.com/icon.jpg'
				},
				created_at: new Date(),
				updated_at: new Date(),
				_count: {
					likes: 0,
					replies: 0
				}
			}

			mockIdeaRepository.findById.mockResolvedValue(mockIdea)
			mockCommentRepository.findById.mockResolvedValue(mockParentComment)
			mockCommentRepository.create.mockResolvedValue(mockCreatedComment)

			// Act
			const result = await controller.createComment(commentData as any, mockRequest)

			// Assert
			expect(result).toEqual({
				comment: {
					id: 'comment-uuid-789',
					content: commentData.content,
					ideaId: commentData.ideaId,
					parentCommentId: 'parent-comment-uuid-456',
					authorId: 'user-profile-123',
					author: {
						id: 'user-profile-123',
						displayName: 'John Doe',
						icon: 'https://example.com/icon.jpg'
					},
					created_at: expect.any(Date),
					updated_at: expect.any(Date),
					_count: {
						likes: 0,
						replies: 0
					}
				}
			})
			expect(mockLogger.info).toHaveBeenCalledWith('Creating comment', {
				userProfileId: 'user-profile-123',
				ideaId: 'idea-uuid-123',
				parentCommentId: 'parent-comment-uuid-456',
				contentLength: commentData.content.length,
				isReply: true
			})
		})

		it('should return UNAUTHORIZED when user is not authenticated', async () => {
			// Arrange
			const commentData = {
				ideaId: 'idea-uuid-123',
				content: 'Test comment',
				parentCommentId: undefined
			}
			const mockRequest = {}

			// Act
			const result = await controller.createComment(commentData as any, mockRequest)

			// Assert
			expect(result).toBe('UNAUTHORIZED')
		})

		it('should return UNAUTHORIZED when user sub is missing', async () => {
			// Arrange
			const commentData = {
				ideaId: 'idea-uuid-123',
				content: 'Test comment',
				parentCommentId: undefined
			}
			const mockRequest = {
				user: {}
			}

			// Act
			const result = await controller.createComment(commentData as any, mockRequest)

			// Assert
			expect(result).toBe('UNAUTHORIZED')
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const commentData = {
				ideaId: 'idea-uuid-123',
				content: 'Test comment',
				parentCommentId: undefined
			}
			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			// Mock repository to throw error
			mockIdeaRepository.findById.mockRejectedValue(new Error('Database connection failed'))

			// Act
			const result = await controller.createComment(commentData as any, mockRequest)

			// Assert
			expect(result).toBe('Failed to create comment')
			expect(mockLogger.error).toHaveBeenCalledWith('Failed to create comment', {
				error: 'Database connection failed',
				userProfileId: 'user-profile-123',
				ideaId: 'idea-uuid-123'
			})
		})

		it('should log appropriate information for comment creation', async () => {
			// Arrange
			const commentData = {
				ideaId: 'idea-uuid-789',
				content: 'This is a test comment for logging purposes.',
				parentCommentId: undefined
			}
			const mockRequest = {
				user: { userProfileId: 'user-profile-789' }
			}

			const mockIdea = {
				id: 'idea-uuid-789',
				title: 'Test Idea',
				description: 'Test Description'
			}

			const mockCreatedComment = {
				id: 'comment-uuid-789',
				content: commentData.content,
				ideaId: commentData.ideaId,
				parentCommentId: null,
				authorId: mockRequest.user.userProfileId,
				author: {
					id: mockRequest.user.userProfileId,
					displayName: 'John Doe',
					icon: 'https://example.com/icon.jpg'
				},
				created_at: new Date(),
				updated_at: new Date(),
				_count: {
					likes: 0,
					replies: 0
				}
			}

			mockIdeaRepository.findById.mockResolvedValue(mockIdea)
			mockCommentRepository.create.mockResolvedValue(mockCreatedComment)

			// Act
			await controller.createComment(commentData as any, mockRequest)

			// Assert
			expect(mockLogger.info).toHaveBeenCalledWith('Creating comment', {
				userProfileId: 'user-profile-789',
				ideaId: 'idea-uuid-789',
				parentCommentId: undefined,
				contentLength: commentData.content.length,
				isReply: false
			})
			expect(mockLogger.info).toHaveBeenCalledWith('Comment created successfully', {
				commentId: 'comment-uuid-789',
				userProfileId: 'user-profile-789',
				ideaId: 'idea-uuid-789'
			})
		})
	})
})

import { Route, Tags, Controller, Body, Post, SuccessResponse, Security, Request } from 'tsoa'
import { inject } from 'tsyringe'
import { injectable } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'
import { CommentRepository } from '@shared/repositories/comment.repository'
import { IdeaRepository } from '@shared/repositories/idea.repository'

export interface CreateCommentInput {
	ideaId: string
	content: string
	parentCommentId?: string
}

@injectable()
@Route('api/v1/comment')
@Tags('Comment')
@Security('jwt')
export class CreateCommentController extends Controller {
	constructor(
		@inject('Logger') private logger: Logger,
		@inject('CommentRepository') private commentRepository: CommentRepository,
		@inject('IdeaRepository') private ideaRepository: IdeaRepository
	) {
		super()
		void this.logger
		void this.commentRepository
		void this.ideaRepository
	}

	/**
	 * Create a new comment on an idea
	 * 
	 * This endpoint allows authenticated users to create comments on ideas or reply
	 * to existing comments. Comments support nested replies through parentCommentId.
	 * 
	 * Comment Creation Process:
	 * - Validates user authentication
	 * - Validates that the target idea exists
	 * - Validates parent comment if replying to a comment
	 * - Creates comment in database with author information
	 * - Returns created comment with engagement metrics
	 * 
	 * @param body - Object containing ideaId, content, and optional parentCommentId
	 * @param request - Express request object containing authenticated user info
	 * @returns Promise resolving to created comment data or error string
	 * 
	 * @example
	 * ```typescript
	 * // Request body for top-level comment
	 * {
	 *   "ideaId": "idea-uuid-123",
	 *   "content": "This is a great idea! I'd love to contribute."
	 * }
	 * 
	 * // Request body for reply comment
	 * {
	 *   "ideaId": "idea-uuid-123",
	 *   "content": "Thanks for the feedback!",
	 *   "parentCommentId": "comment-uuid-456"
	 * }
	 * 
	 * // Success response (201)
	 * {
	 *   "comment": {
	 *     "id": "comment-uuid-789",
	 *     "content": "This is a great idea! I'd love to contribute.",
	 *     "ideaId": "idea-uuid-123",
	 *     "parentCommentId": null,
	 *     "authorId": "user-profile-uuid",
	 *     "author": {
	 *       "id": "user-profile-uuid",
	 *       "displayName": "John Doe",
	 *       "icon": "https://example.com/icon.jpg"
	 *     },
	 *     "created_at": "2023-01-01T00:00:00.000Z",
	 *     "updated_at": "2023-01-01T00:00:00.000Z",
	 *     "_count": {
	 *       "likes": 0,
	 *       "replies": 0
	 *     }
	 *   }
	 * }
	 * 
	 * // Error responses
	 * "UNAUTHORIZED" // User not authenticated
	 * "IDEA_NOT_FOUND" // Target idea doesn't exist
	 * "PARENT_COMMENT_NOT_FOUND" // Parent comment doesn't exist
	 * "VALIDATION_ERROR" // Invalid input data
	 * "DATABASE_ERROR" // Database operation failed
	 * ```
	 */
	@SuccessResponse(201, 'Comment created successfully')
	@Post('/')
	@LogResponseTime()
	public async createComment(
		@Body() body: CreateCommentInput,
		@Request() request: any
	): Promise<any> {
		try {
			const userProfileId = request.user?.userProfileId
			if (!userProfileId) {
				this.setStatus(401)
				return 'UNAUTHORIZED'
			}

			// O middleware já validou e processou os dados de entrada
			const inputDTO = request.getInputDTO?.() as CreateCommentInput || body
			const { ideaId, content, parentCommentId } = inputDTO

			this.logger.info('Creating comment', { 
				userProfileId, 
				ideaId, 
				parentCommentId,
				contentLength: content.length,
				isReply: !!parentCommentId
			})

			// Validate that idea exists
			const idea = await this.ideaRepository.findById(ideaId)
			if (!idea) {
				this.setStatus(404)
				return 'IDEA_NOT_FOUND'
			}

			// Validate parent comment if provided
			if (parentCommentId) {
				const parentComment = await this.commentRepository.findById(parentCommentId)
				if (!parentComment) {
					this.setStatus(404)
					return 'PARENT_COMMENT_NOT_FOUND'
				}
			}

			// Create comment in database
			const newComment = await this.commentRepository.create({
				ideaId,
				content,
				commentId: parentCommentId || undefined,
				userProfileId: userProfileId
			})

			this.logger.info('Comment created successfully', { 
				commentId: newComment.id, 
				userProfileId, 
				ideaId 
			})

			// O middleware irá automaticamente serializar usando CreateCommentResponseDTO
			this.setStatus(201)
			return { comment: newComment }

		} catch (error) {
			this.logger.error('Failed to create comment', { 
				error: error instanceof Error ? error.message : 'Unknown error',
				userProfileId: request.user?.userProfileId,
				ideaId: body.ideaId
			})
			
			this.setStatus(500)
			return 'Failed to create comment'
		}
	}
}

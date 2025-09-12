import { Route, Tags, Controller, Body, Post, SuccessResponse, Security, Request } from 'tsoa'
import { inject } from 'tsyringe'
import { injectable } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'
import { ToggleLikeInput, ToggleLikeResponse } from './toggle-like.dto'
import { LikeRepository } from '@shared/repositories/like.repository'
import { IdeaRepository } from '@shared/repositories/idea.repository'
import { CommentRepository } from '@shared/repositories/comment.repository'
import { ErrorResponse, CommonErrors } from '@shared/utils/error-response'

@injectable()
@Route('/v1/likes')
@Tags('Likes')
@Security('jwt')
export class ToggleLikeController extends Controller {
	constructor(
		@inject('Logger') private logger: Logger,
		@inject('LikeRepository') private likeRepository: LikeRepository,
		@inject('IdeaRepository') private ideaRepository: IdeaRepository,
		@inject('CommentRepository') private commentRepository: CommentRepository
	) {
		super()
		void this.logger
		void this.likeRepository
		void this.ideaRepository
		void this.commentRepository
	}

	/**
	 * Toggle like on idea or comment
	 * 
	 * This endpoint allows authenticated users to like or unlike ideas and comments.
	 * If the user hasn't liked the content before, it will create a like. If they
	 * have already liked it, it will remove the like (toggle behavior).
	 * 
	 * Like Toggle Process:
	 * - Validates user authentication
	 * - Checks if user has already liked the content
	 * - Creates like if not exists, removes if exists
	 * - Updates like count for the content
	 * - Returns current like status and count
	 * 
	 * @param body - Object containing ideaId and optional commentId
	 * @param request - Express request object containing authenticated user info
	 * @returns Promise resolving to like status and count or error string
	 * 
	 * @example
	 * ```typescript
	 * // Request body for idea like
	 * {
	 *   "ideaId": "idea-uuid-123"
	 * }
	 * 
	 * // Request body for comment like
	 * {
	 *   "ideaId": "idea-uuid-123",
	 *   "commentId": "comment-uuid-456"
	 * }
	 * 
	 * // Success response (200)
	 * {
	 *   "liked": true,
	 *   "likeCount": 15,
	 *   "message": "Like added successfully"
	 * }
	 * 
	 * // Success response (200) - when unliking
	 * {
	 *   "liked": false,
	 *   "likeCount": 14,
	 *   "message": "Like removed successfully"
	 * }
	 * 
	 * // Error responses
	 * "UNAUTHORIZED" // User not authenticated
	 * "CONTENT_NOT_FOUND" // Idea or comment doesn't exist
	 * "VALIDATION_ERROR" // Invalid input data
	 * "DATABASE_ERROR" // Database operation failed
	 * ```
	 */
	@SuccessResponse(200, 'Like toggled successfully')
	@Post('/toggle')
	@LogResponseTime()
	public async toggleLike(
		@Body() body: ToggleLikeInput,
		@Request() request: any
	): Promise<ToggleLikeResponse | ErrorResponse> {
		console.log('ToggleLikeController - Método toggleLike chamado')
		console.log('ToggleLikeController - Body:', body)
		console.log('ToggleLikeController - Request user:', request.user)
		
		try {
			const userProfileId = request.user?.userProfileId
			if (!userProfileId) {
				this.setStatus(CommonErrors.UNAUTHORIZED.code)
				return CommonErrors.UNAUTHORIZED
			}

			const { ideaId, commentId } = body

			this.logger.info('Toggling like', { 
				userProfileId, 
				ideaId, 
				commentId,
				action: commentId ? 'comment_like' : 'idea_like'
			})

			// Validate that idea exists
			if (ideaId) {
				const idea = await this.ideaRepository.findById(ideaId)
				if (!idea) {
					this.setStatus(CommonErrors.IDEA_NOT_FOUND.code)
					return CommonErrors.IDEA_NOT_FOUND
				}
			}

			// Validate that comment exists if provided
			if (commentId) {
				const comment = await this.commentRepository.findById(commentId)
				if (!comment) {
					this.setStatus(CommonErrors.COMMENT_NOT_FOUND.code)
					return CommonErrors.COMMENT_NOT_FOUND
				}
			}

			// Check if user has already liked the content
			const existingLike = await this.likeRepository.findByUserAndContent({
				ideaId,
				commentId,
				userProfileId
			})

			let response: ToggleLikeResponse

			if (existingLike) {
				// User has already liked, so remove the like
				await this.likeRepository.deleteByUserAndContent({
					ideaId,
					commentId,
					userProfileId
				})

				// Get updated like count
				const likeCount = await this.likeRepository.getLikeCount({ ideaId, commentId })

				response = {
					liked: false,
					likeCount,
					message: 'Like removed successfully'
				}
			} else {
				// User hasn't liked yet, so add the like
				await this.likeRepository.create({
					ideaId,
					commentId,
					userProfileId
				})

				// Get updated like count
				const likeCount = await this.likeRepository.getLikeCount({ ideaId, commentId })

				response = {
					liked: true,
					likeCount,
					message: 'Like added successfully'
				}
			}

			this.logger.info('Like toggled successfully', { 
				userProfileId, 
				ideaId, 
				commentId,
				liked: response.liked,
				likeCount: response.likeCount
			})

			this.setStatus(200)
			return response

		} catch (error) {
			this.logger.error('Failed to toggle like', { 
				error: error instanceof Error ? error.message : 'Unknown error',
				userProfileId: request.user?.userProfileId,
				ideaId: body.ideaId,
				commentId: body.commentId
			})
			
			this.setStatus(CommonErrors.DATABASE_ERROR.code)
			return CommonErrors.DATABASE_ERROR
		}
	}
}

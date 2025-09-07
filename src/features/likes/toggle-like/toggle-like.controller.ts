import { Route, Tags, Controller, Body, Post, SuccessResponse, Security, Request } from 'tsoa'
import { inject } from 'tsyringe'
import { injectable } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators'
import { ToggleLikeInput, ToggleLikeResponse } from './toggle-like.dto'

@injectable()
@Route('api/v1/likes')
@Tags('Likes')
@Security('jwt')
export class ToggleLikeController extends Controller {
	constructor(
		@inject('Logger') private logger: Logger
	) {
		super()
		void this.logger
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
	): Promise<ToggleLikeResponse | string> {
		try {
			const userId = request.user?.sub
			if (!userId) {
				this.setStatus(401)
				return 'UNAUTHORIZED'
			}

			const { ideaId, commentId } = body

			this.logger.info('Toggling like', { 
				userId, 
				ideaId, 
				commentId,
				action: commentId ? 'comment_like' : 'idea_like'
			})

			// TODO: Implement like toggle logic
			// 1. Validate that idea (and comment if provided) exists
			// 2. Check if user has already liked the content
			// 3. Create or remove like accordingly
			// 4. Update like count
			// 5. Return current status

			// Mock response - assuming like was added
			const response = {
				liked: true,
				likeCount: 15,
				message: 'Like added successfully'
			}

			this.logger.info('Like toggled successfully', { 
				userId, 
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
				userId: request.user?.sub,
				ideaId: body.ideaId,
				commentId: body.commentId
			})
			
			this.setStatus(500)
			return 'DATABASE_ERROR'
		}
	}
}

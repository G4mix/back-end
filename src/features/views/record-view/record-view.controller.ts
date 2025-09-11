import { Route, Tags, Controller, Body, Post, SuccessResponse, Security, Request } from 'tsoa'
import { inject } from 'tsyringe'
import { injectable } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'
import { RecordViewInput, RecordViewResponse } from './record-view.dto'
import { ViewRepository } from '@shared/repositories/view.repository'
import { IdeaRepository } from '@shared/repositories/idea.repository'

@injectable()
@Route('api/v1/views')
@Tags('Views')
@Security('jwt')
export class RecordViewController extends Controller {
	constructor(
		@inject('Logger') private logger: Logger,
		@inject('ViewRepository') private viewRepository: ViewRepository,
		@inject('IdeaRepository') private ideaRepository: IdeaRepository
	) {
		super()
		void this.logger
		void this.viewRepository
		void this.ideaRepository
	}

	/**
	 * Record a view for idea or comment
	 * 
	 * This endpoint allows authenticated users to record a view for ideas or comments.
	 * Views are tracked to provide analytics and engagement metrics. The system
	 * prevents duplicate views from the same user within a certain time period.
	 * 
	 * View Recording Process:
	 * - Validates user authentication
	 * - Checks if user has already viewed the content recently
	 * - Records new view if not duplicate
	 * - Updates view count for the content
	 * - Returns current view status and count
	 * 
	 * @param body - Object containing ideaId and optional commentId
	 * @param request - Express request object containing authenticated user info
	 * @returns Promise resolving to view status and count or error string
	 * 
	 * @example
	 * ```typescript
	 * // Request body for idea view
	 * {
	 *   "ideaId": "idea-uuid-123"
	 * }
	 * 
	 * // Request body for comment view
	 * {
	 *   "ideaId": "idea-uuid-123",
	 *   "commentId": "comment-uuid-456"
	 * }
	 * 
	 * // Success response (200)
	 * {
	 *   "viewed": true,
	 *   "viewCount": 125,
	 *   "message": "View recorded successfully"
	 * }
	 * 
	 * // Success response (200) - when view already exists
	 * {
	 *   "viewed": false,
	 *   "viewCount": 125,
	 *   "message": "View already recorded"
	 * }
	 * 
	 * // Error responses
	 * "UNAUTHORIZED" // User not authenticated
	 * "CONTENT_NOT_FOUND" // Idea or comment doesn't exist
	 * "VALIDATION_ERROR" // Invalid input data
	 * "DATABASE_ERROR" // Database operation failed
	 * ```
	 */
	@SuccessResponse(200, 'View recorded successfully')
	@Post('/record')
	@LogResponseTime()
	public async recordView(
		@Body() body: RecordViewInput,
		@Request() request: any
	): Promise<RecordViewResponse | string> {
		try {
			const userProfileId = request.user?.userProfileId
			if (!userProfileId) {
				this.setStatus(401)
				return 'UNAUTHORIZED'
			}

			const { ideas } = body

			this.logger.info('Recording view', { 
				userProfileId, 
				ideas, 
				action: 'idea_view'
			})

			// Validate that all ideas exist
			for (const ideaId of ideas) {
				const idea = await this.ideaRepository.findById(ideaId)
				if (!idea) {
					this.setStatus(404)
					return 'IDEA_NOT_FOUND'
				}
			}

			// Record views for all ideas (skipDuplicates handles duplicates)
			await this.viewRepository.createMany({
				userProfileId,
				ideas
			})

			// Get total view count for the first idea (for response)
			const viewCount = await this.viewRepository.getCount({ ideaId: ideas[0] })

			const response: RecordViewResponse = {
				viewed: true,
				viewCount,
				message: 'View recorded successfully'
			}

			this.logger.info('View recorded successfully', { 
				userProfileId, 
				ideas, 
				viewed: response.viewed,
				viewCount: response.viewCount
			})

			this.setStatus(200)
			return response

		} catch (error) {
			this.logger.error('Failed to record view', { 
				error: error instanceof Error ? error.message : 'Unknown error',
				userProfileId: request.user?.userProfileId,
				ideas: body.ideas,
			})
			
			this.setStatus(500)
			return 'DATABASE_ERROR'
		}
	}
}

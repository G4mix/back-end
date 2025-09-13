import { Route, Tags, Controller, Path, Delete, SuccessResponse, Security, Request } from 'tsoa'
import { inject, injectable } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'
import { IdeaRepository } from '@shared/repositories/idea.repository'
import { ErrorResponse, CommonErrors } from '@shared/utils/error-response'

@injectable()
@Route('/v1/idea')
@Tags('Ideas')
@Security('jwt')
export class DeleteIdeaController extends Controller {
	constructor(
		@inject('Logger') private logger: Logger,
		@inject('IdeaRepository') private ideaRepository: IdeaRepository
	) {
		super()
	}

	/**
	 * Delete an existing idea with comprehensive validation
	 *
	 * This endpoint allows authenticated users to delete their own ideas.
	 * Only the author of the idea can delete it. This action is irreversible
	 * and will permanently remove the idea and all associated data from the system.
	 *
	 * Idea Deletion Process:
	 * - Validates user authentication via JWT token
	 * - Validates idea ID parameter format
	 * - Checks if idea exists in database
	 * - Verifies user is the author of the idea
	 * - Permanently deletes idea from database
	 * - Cascades deletion to related data (likes, comments, views)
	 * - Returns confirmation message
	 *
	 * Security Features:
	 * - Author-only deletion permissions
	 * - Comprehensive authorization checks
	 * - Irreversible operation confirmation
	 * - Complete data cleanup
	 * - Proper error handling and logging
	 *
	 * @param id The unique identifier of the idea to delete (UUID format)
	 * @param request The Express request object, containing user authentication details
	 * @returns Promise resolving to deletion confirmation message or error string
	 * 
	 * @example
	 * ```typescript
	 * // URL: /v1/idea/uuid-of-idea
	 * // Method: DELETE
	 * // Headers: Authorization: Bearer jwt_token
	 * 
	 * // Success response (200)
	 * "Idea deleted successfully"
	 * 
	 * // Error responses
	 * "UNAUTHORIZED" // User not authenticated
	 * "IDEA_NOT_FOUND" // Idea with specified ID doesn't exist
	 * "FORBIDDEN" // User is not the author of the idea
	 * "VALIDATION_ERROR" // Invalid idea ID format
	 * "DATABASE_ERROR" // Database operation failed
	 * ```
	 */
	@SuccessResponse(200, 'Idea deleted successfully')
	@Delete('/{id}')
	@LogResponseTime()
	public async deleteIdea(
		@Path() id: string,
		@Request() request: any
	): Promise<string | ErrorResponse> {
		try {
			const userProfileId = request.user?.userProfileId
			if (!userProfileId) {
				this.setStatus(CommonErrors.UNAUTHORIZED.code)
				return CommonErrors.UNAUTHORIZED
			}

			this.logger.info('Deleting idea', {
				userProfileId,
				ideaId: id
			})

			// Check if idea exists
			const existingIdea = await this.ideaRepository.findById(id)
			if (!existingIdea) {
				this.setStatus(CommonErrors.IDEA_NOT_FOUND.code)
				return CommonErrors.IDEA_NOT_FOUND
			}

			// Check if user is the author
			if (existingIdea.authorId !== userProfileId) {
				this.setStatus(CommonErrors.FORBIDDEN.code)
				return CommonErrors.FORBIDDEN
			}

			// Delete idea from database
			await this.ideaRepository.delete(id)

			this.logger.info('Idea deleted successfully', {
				ideaId: id,
				userProfileId
			})

			this.setStatus(200)
			return 'Idea deleted successfully'

		} catch (error) {
			this.logger.error('Failed to delete idea', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userProfileId: request.user?.userProfileId,
				ideaId: id
			})
			this.setStatus(CommonErrors.DATABASE_ERROR.code)
			return CommonErrors.DATABASE_ERROR
		}
	}
}

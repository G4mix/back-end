import { Route, Tags, Controller, Path, Delete, SuccessResponse, Security, Request } from 'tsoa'
import { inject, injectable } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'
import { IdeaRepository } from '@shared/repositories/idea.repository'
import { ErrorResponse, CommonErrors } from '@shared/utils/error-response'

@injectable()
@Route('/v1/ideas')
@Tags('Ideas')
@Security('jwt')
export class DeleteIdeaController extends Controller {
	constructor(
		@inject('Logger') private logger: Logger,
		@inject('IdeaRepository') private ideaRepository: IdeaRepository
	) {
		super()
		void this.logger
		void this.ideaRepository
	}

	/**
	 * Delete an existing idea
	 *
	 * This endpoint allows authenticated users to delete their own ideas.
	 * Only the author of the idea can delete it. This action is irreversible.
	 *
	 * @param id The unique identifier of the idea to delete.
	 * @param request The Express request object, containing user authentication details.
	 * @returns A success message or an error message.
	 * @example response-200
	 * "Idea deleted successfully"
	 * @example response-401
	 * "UNAUTHORIZED"
	 * @example response-403
	 * "FORBIDDEN"
	 * @example response-404
	 * "IDEA_NOT_FOUND"
	 * @example response-500
	 * "Failed to delete idea"
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

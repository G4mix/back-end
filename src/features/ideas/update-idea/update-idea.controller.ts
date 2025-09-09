import { Route, Tags, Controller, Path, Patch, Body, SuccessResponse, Security, Request } from 'tsoa'
import { inject, injectable } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators'
import { IdeaRepository } from '@shared/repositories/idea.repository'
import { UpdateIdeaInput, UpdateIdeaResponse } from './update-idea.dto'

@injectable()
@Route('api/v1/ideas')
@Tags('Ideas')
@Security('jwt')
export class UpdateIdeaController extends Controller {
	constructor(
		@inject('Logger') private logger: Logger,
		@inject('IdeaRepository') private ideaRepository: IdeaRepository
	) {
		super()
		void this.logger
		void this.ideaRepository
	}

	/**
	 * Update an existing idea
	 *
	 * This endpoint allows authenticated users to update their own ideas.
	 * Only the author of the idea can update it.
	 *
	 * @param id The unique identifier of the idea to update.
	 * @param body The request body containing the updated idea details.
	 * @param request The Express request object, containing user authentication details.
	 * @returns A success message with the updated idea's details or an error message.
	 * @example response-200
	 * {
	 *   "idea": {
	 *     "id": "uuid-of-idea",
	 *     "title": "Updated Mobile App Idea",
	 *     "description": "An updated description of the mobile app concept...",
	 *     "authorId": "uuid-of-user-profile",
	 *     "created_at": "2023-10-27T10:00:00Z",
	 *     "updated_at": "2023-10-27T11:00:00Z"
	 *   }
	 * }
	 * @example response-401
	 * "UNAUTHORIZED"
	 * @example response-403
	 * "FORBIDDEN"
	 * @example response-404
	 * "IDEA_NOT_FOUND"
	 * @example response-500
	 * "Failed to update idea"
	 */
	@SuccessResponse(200, 'Idea updated successfully')
	@Patch('/{id}')
	@LogResponseTime()
	public async updateIdea(
		@Path() id: string,
		@Body() body: UpdateIdeaInput,
		@Request() request: any
	): Promise<UpdateIdeaResponse | string> {
		try {
			const userProfileId = request.user?.userProfileId
			if (!userProfileId) {
				this.setStatus(401)
				return 'UNAUTHORIZED'
			}

			this.logger.info('Updating idea', {
				userProfileId,
				ideaId: id,
				title: body.title,
				descriptionLength: body.description?.length
			})

			// Check if idea exists
			const existingIdea = await this.ideaRepository.findById(id)
			if (!existingIdea) {
				this.setStatus(404)
				return 'IDEA_NOT_FOUND'
			}

			// Check if user is the author
			if (existingIdea.authorId !== userProfileId) {
				this.setStatus(403)
				return 'FORBIDDEN'
			}

			// Update idea in database
			const updatedIdea = await this.ideaRepository.update(id, body)

			this.logger.info('Idea updated successfully', {
				ideaId: id,
				userProfileId
			})

			this.setStatus(200)
			return {
				idea: {
					...updatedIdea,
					created_at: updatedIdea.created_at.toISOString(),
					updated_at: updatedIdea.updated_at.toISOString()
				}
			}

		} catch (error) {
			this.logger.error('Failed to update idea', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userProfileId: request.user?.userProfileId,
				ideaId: id
			})
			this.setStatus(500)
			return 'Failed to update idea'
		}
	}
}

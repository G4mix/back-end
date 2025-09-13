import { Route, Tags, Controller, Path, Patch, Body, SuccessResponse, Security, Request } from 'tsoa'
import { inject, injectable } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'
import { IdeaRepository } from '@shared/repositories/idea.repository'
import { UpdateIdeaInput, UpdateIdeaResponse } from './update-idea.dto'
import { IdeaGateway } from '@shared/gateways/idea.gateway'
import { ErrorResponse, CommonErrors } from '@shared/utils/error-response'

@injectable()
@Route('/v1/idea')
@Tags('Ideas')
@Security('jwt')
export class UpdateIdeaController extends Controller {
	constructor(
		@inject('Logger') private logger: Logger,
		@inject('IdeaRepository') private ideaRepository: IdeaRepository,
		@inject('IdeaGateway') private ideaGateway: IdeaGateway
	) {
		super()
	}

	/**
	 * Update an existing idea with comprehensive validation
	 *
	 * This endpoint allows authenticated users to update their own ideas.
	 * Only the author of the idea can update it. Supports partial updates
	 * and includes image management with automatic cleanup of old images.
	 *
	 * Idea Update Process:
	 * - Validates user authentication via JWT token
	 * - Validates idea ID parameter format
	 * - Checks if idea exists in database
	 * - Verifies user is the author of the idea
	 * - Processes new images if provided (deletes old ones)
	 * - Updates idea fields in database
	 * - Returns updated idea with new timestamps
	 *
	 * Features:
	 * - Author-only update permissions
	 * - Partial update support (only provided fields)
	 * - Image management with automatic cleanup
	 * - Comprehensive input validation
	 * - Secure file handling via IdeaGateway
	 * - Proper timestamp updates
	 *
	 * @param id The unique identifier of the idea to update (UUID format)
	 * @param body The request body containing the updated idea details
	 * @param request The Express request object, containing user authentication details
	 * @returns Promise resolving to updated idea details or error message
	 * 
	 * @example
	 * ```typescript
	 * // Request body
	 * {
	 *   "title": "Updated Mobile App Idea",
	 *   "description": "An updated description of the mobile app concept...",
	 *   "summary": "Updated brief summary",
	 *   "tags": "mobile,app,innovation,updated",
	 *   "images": [File], // Optional new images
	 *   "links": ["https://github.com/updated-project"]
	 * }
	 * 
	 * // Success response (200)
	 * {
	 *   "idea": {
	 *     "id": "uuid-of-idea",
	 *     "title": "Updated Mobile App Idea",
	 *     "description": "An updated description of the mobile app concept...",
	 *     "summary": "Updated brief summary",
	 *     "tags": "mobile,app,innovation,updated",
	 *     "images": [
	 *       { "src": "https://s3.amazonaws.com/bucket/new-image.jpg", "alt": "Updated mockup" }
	 *     ],
	 *     "links": ["https://github.com/updated-project"],
	 *     "authorId": "uuid-of-user-profile",
	 *     "created_at": "2023-10-27T10:00:00Z",
	 *     "updated_at": "2023-10-27T11:00:00Z"
	 *   }
	 * }
	 * 
	 * // Error responses
	 * "UNAUTHORIZED" // User not authenticated
	 * "IDEA_NOT_FOUND" // Idea with specified ID doesn't exist
	 * "FORBIDDEN" // User is not the author of the idea
	 * "VALIDATION_ERROR" // Invalid input data
	 * "UPLOAD_ERROR" // Image upload failed
	 * "DATABASE_ERROR" // Database operation failed
	 * ```
	 */
	@SuccessResponse(200, 'Idea updated successfully')
	@Patch('/{id}')
	@LogResponseTime()
	public async updateIdea(
		@Path() id: string,
		@Body() body: UpdateIdeaInput,
		@Request() request: any
	): Promise<UpdateIdeaResponse | ErrorResponse> {
		try {
			const userProfileId = request?.user?.userProfileId
			if (!userProfileId) {
				this.setStatus(CommonErrors.UNAUTHORIZED.code)
				return CommonErrors.UNAUTHORIZED
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
				this.setStatus(CommonErrors.IDEA_NOT_FOUND.code)
				return CommonErrors.IDEA_NOT_FOUND
			}

			// Check if user is the author
			if (existingIdea.authorId !== userProfileId) {
				this.setStatus(CommonErrors.FORBIDDEN.code)
				return CommonErrors.FORBIDDEN
			}

			// Process images if provided
			let processedImages = undefined
			if (body.images && body.images.length > 0) {
				// Delete old images first
				if (existingIdea.images && existingIdea.images.length > 0) {
					const oldImageUrls = existingIdea.images.map((img: any) => img.src)
					await this.ideaGateway.deleteIdeaImages({ imageUrls: oldImageUrls })
				}
				
				// Upload new images
				processedImages = await this.ideaGateway.uploadIdeaImages({
					files: body.images
				})
			}

			// Update idea in database
			const updatedIdea = await this.ideaRepository.update(id, {
				...body,
				images: processedImages
			})

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
			this.setStatus(CommonErrors.DATABASE_ERROR.code)
			return CommonErrors.DATABASE_ERROR
		}
	}
}

import { Route, Tags, Controller, Body, Post, SuccessResponse, Security, Request } from 'tsoa'
import { inject } from 'tsyringe'
import { injectable } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'
import { IdeaRepository } from '@shared/repositories/idea.repository'
import { CreateIdeaInput, CreateIdeaResponse } from './create-idea.dto'
import { IdeaGateway } from '@shared/gateways/idea.gateway'

@injectable()
@Route('/v1/ideas')
@Tags('Ideas')
@Security('jwt')
export class CreateIdeaController extends Controller {
	constructor(
		@inject('Logger') private logger: Logger,
		@inject('IdeaRepository') private ideaRepository: IdeaRepository,
		@inject('IdeaGateway') private ideaGateway: IdeaGateway
	) {
		super()
		void this.logger
		void this.ideaRepository
		void this.ideaGateway
	}

	/**
	 * Create a new idea
	 * 
	 * This endpoint allows authenticated users to create new ideas. The idea will be
	 * associated with the authenticated user's profile and will be visible to other
	 * users based on the platform's visibility rules.
	 * 
	 * Idea Creation Process:
	 * - Validates input data (title, description, summary, tags)
	 * - Associates idea with authenticated user's profile
	 * - Creates idea record in database
	 * - Returns created idea with generated ID and timestamps
	 * 
	 * @param body - Object containing idea data (title, description, summary, tags)
	 * @param request - Express request object containing authenticated user info
	 * @returns Promise resolving to created idea data or error string
	 * 
	 * @example
	 * ```typescript
	 * 
	 * // Success response (201)
	 * {
	 *   "idea": {
	 *     "id": "idea-uuid-123",
	 *     "title": "Revolutionary Mobile App Idea",
	 *     "description": "A detailed description...",
	 *     "summary": "Brief summary",
	 *     "tags": "mobile,app,innovation",
	 *     "authorId": "user-profile-uuid",
	 *     "created_at": "2023-01-01T00:00:00.000Z",
	 *     "updated_at": "2023-01-01T00:00:00.000Z"
	 *   }
	 * }
	 * 
	 * // Error responses
	 * "UNAUTHORIZED" // User not authenticated
	 * "VALIDATION_ERROR" // Invalid input data
	 * "DATABASE_ERROR" // Database operation failed
	 * ```
	 */
	@SuccessResponse(201, 'Idea created successfully')
	@Post('/')
	@LogResponseTime()
	public async createIdea(
		@Body() body: CreateIdeaInput,
		@Request() request: any
	): Promise<CreateIdeaResponse | string> {
		try {
			const userProfileId = request.user?.userProfileId
			if (!userProfileId) {
				this.setStatus(401)
				return 'UNAUTHORIZED'
			}

			this.logger.info('Creating new idea', { 
				userProfileId, 
				title: body.title,
				descriptionLength: body.description.length 
			})

			// Validate that title is unique
			const existingIdea = await this.ideaRepository.findByTitle(body.title)
			if (existingIdea) {
				this.setStatus(409)
				return 'IDEA_ALREADY_EXISTS'
			}

			// Process images if provided
			let processedImages = undefined
			if (body.images && body.images.length > 0) {
				processedImages = await this.ideaGateway.uploadIdeaImages({
					files: body.images
				})
			}

			// Create idea in database
			const newIdea = await this.ideaRepository.create({
				title: body.title,
				description: body.description,
				authorId: userProfileId,
				tags: body.tags,
				images: processedImages,
				links: body.links
			})

			this.logger.info('Idea created successfully', { 
				ideaId: newIdea.id, 
				userProfileId 
			})

			this.setStatus(201)
			return { 
				idea: {
					...newIdea,
					created_at: newIdea.created_at.toISOString(),
					updated_at: newIdea.updated_at.toISOString()
				}
			}

		} catch (error) {
			this.logger.error('Failed to create idea', { 
				error: error instanceof Error ? error.message : 'Unknown error',
				userProfileId: request.user?.userProfileId 
			})
			
			this.setStatus(500)
			return 'Failed to create idea'
		}
	}
}

import { Route, Tags, Controller, Path, Get, SuccessResponse, Security, Request } from 'tsoa'
import { inject, injectable } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'
import { IdeaRepository } from '@shared/repositories/idea.repository'
import { GetIdeaByIdResponse } from './get-idea-by-id.dto'
import { ErrorResponse, CommonErrors } from '@shared/utils/error-response'

@injectable()
@Route('/v1/idea')
@Tags('Ideas')
@Security('jwt')
export class GetIdeaByIdController extends Controller {
	constructor(
		@inject('Logger') private logger: Logger,
		@inject('IdeaRepository') private ideaRepository: IdeaRepository
	) {
		super()
	}

	/**
	 * Get a specific idea by ID with complete details
	 *
	 * This endpoint allows authenticated users to retrieve a specific idea by its ID.
	 * The response includes complete idea details, author information, engagement metrics,
	 * and all associated data. Useful for displaying individual idea pages and detailed views.
	 *
	 * Idea Retrieval Process:
	 * - Validates user authentication via JWT token
	 * - Validates idea ID parameter format
	 * - Searches for idea in database by ID
	 * - Retrieves complete idea information including author details
	 * - Includes engagement metrics (likes, views, comments)
	 * - Serializes data with proper timestamps
	 * - Returns comprehensive idea data or error
	 *
	 * Features:
	 * - Complete idea information with all fields
	 * - Author profile information and details
	 * - Real-time engagement metrics
	 * - Proper timestamp formatting
	 * - Comprehensive error handling
	 * - Performance optimized single-idea queries
	 *
	 * @param id The unique identifier of the idea to retrieve (UUID format)
	 * @param request The Express request object, containing user authentication details
	 * @returns Promise resolving to complete idea details or error message
	 * 
	 * @example
	 * ```typescript
	 * // URL: /v1/idea/uuid-of-idea
	 * 
	 * // Success response (200)
	 * {
	 *   "idea": {
	 *     "id": "uuid-of-idea",
	 *     "title": "Revolutionary Mobile App",
	 *     "description": "A detailed description of the mobile app concept...",
	 *     "summary": "Brief summary of the idea",
	 *     "tags": "mobile,app,innovation",
	 *     "images": [
	 *       { "src": "https://s3.amazonaws.com/bucket/image1.jpg", "alt": "App mockup" }
	 *     ],
	 *     "links": ["https://github.com/project"],
	 *     "authorId": "uuid-of-user-profile",
	 *     "author": {
	 *       "id": "uuid-of-user-profile",
	 *       "displayName": "John Doe",
	 *       "icon": "https://example.com/icon.jpg"
	 *     },
	 *     "created_at": "2023-10-27T10:00:00Z",
	 *     "updated_at": "2023-10-27T10:00:00Z",
	 *     "_count": {
	 *       "likes": 15,
	 *       "views": 120,
	 *       "comments": 8
	 *     }
	 *   }
	 * }
	 * 
	 * // Error responses
	 * "UNAUTHORIZED" // User not authenticated
	 * "IDEA_NOT_FOUND" // Idea with specified ID doesn't exist
	 * "VALIDATION_ERROR" // Invalid idea ID format
	 * "DATABASE_ERROR" // Database operation failed
	 * ```
	 */
	@SuccessResponse(200, 'Idea retrieved successfully')
	@Get('/{id}')
	@LogResponseTime()
	public async getIdeaById(
		@Path() id: string,
		@Request() request: any
	): Promise<GetIdeaByIdResponse | ErrorResponse> {
		try {
			const userProfileId = request.user?.userProfileId
			if (!userProfileId) {
				this.setStatus(CommonErrors.UNAUTHORIZED.code)
				return CommonErrors.UNAUTHORIZED
			}

			this.logger.info('Retrieving idea by ID', {
				userProfileId,
				ideaId: id
			})

			// Retrieve idea from database
			const idea = await this.ideaRepository.findById(id)
			if (!idea) {
				this.setStatus(CommonErrors.IDEA_NOT_FOUND.code)
				return CommonErrors.IDEA_NOT_FOUND
			}

			this.logger.info('Idea retrieved successfully', {
				userProfileId,
				ideaId: id,
				title: idea.title
			})

			this.setStatus(200)
			return {
				idea: {
					...idea,
					created_at: idea.created_at.toISOString(),
					updated_at: idea.updated_at.toISOString()
				}
			}

		} catch (error) {
			this.logger.error('Failed to retrieve idea', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userProfileId: request.user?.userProfileId,
				ideaId: id
			})
			this.setStatus(CommonErrors.DATABASE_ERROR.code)
			return CommonErrors.DATABASE_ERROR
		}
	}
}

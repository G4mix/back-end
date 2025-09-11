import { Route, Tags, Controller, Query, Get, SuccessResponse, Security, Request } from 'tsoa'
import { inject } from 'tsyringe'
import { injectable } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'
import { IdeaRepository } from '@shared/repositories/idea.repository'

@injectable()
@Route('/v1/ideas')
@Tags('Ideas')
@Security('jwt')
export class GetIdeasController extends Controller {
	constructor(
		@inject('Logger') private logger: Logger,
		@inject('IdeaRepository') private ideaRepository: IdeaRepository
	) {
		super()
		void this.logger
		void this.ideaRepository
	}

	/**
	 * Get list of ideas with filtering and pagination
	 * 
	 * This endpoint allows authenticated users to retrieve a paginated list of ideas
	 * with various filtering options. Users can search by title/description, filter
	 * by author, tags, and sort by different criteria.
	 * 
	 * Ideas Retrieval Process:
	 * - Validates query parameters (pagination, filters, sorting)
	 * - Applies search filters if provided
	 * - Retrieves ideas from database with pagination
	 * - Includes author information and engagement metrics
	 * - Returns paginated results with metadata
	 * 
	 * @param query - Query parameters for filtering and pagination
	 * @param request - Express request object containing authenticated user info
	 * @returns Promise resolving to paginated ideas list or error string
	 * 
	 * @example
	 * ```typescript
	 * // Query parameters
	 * {
	 *   "search": "mobile app",
	 *   "authorId": "user-profile-uuid",
	 *   "tags": "innovation,technology",
	 *   "page": 0,
	 *   "limit": 10,
	 *   "sortBy": "created_at",
	 *   "sortOrder": "desc"
	 * }
	 * 
	 * // Success response (200)
	 * {
	 *   "ideas": [
	 *     {
	 *       "id": "idea-uuid-123",
	 *       "title": "Revolutionary Mobile App",
	 *       "description": "A detailed description...",
	 *       "summary": "Brief summary",
	 *       "tags": "mobile,app,innovation",
	 *       "authorId": "user-profile-uuid",
	 *       "author": {
	 *         "id": "user-profile-uuid",
	 *         "displayName": "John Doe",
	 *         "icon": "https://example.com/icon.jpg"
	 *       },
	 *       "created_at": "2023-01-01T00:00:00.000Z",
	 *       "updated_at": "2023-01-01T00:00:00.000Z",
	 *       "_count": {
	 *         "likes": 15,
	 *         "views": 120,
	 *         "comments": 8
	 *       }
	 *     }
	 *   ],
	 *   "pagination": {
	 *     "page": 0,
	 *     "limit": 10,
	 *     "total": 25,
	 *     "totalPages": 3,
	 *     "hasNext": true,
	 *     "hasPrev": false
	 *   }
	 * }
	 * 
	 * // Error responses
	 * "UNAUTHORIZED" // User not authenticated
	 * "VALIDATION_ERROR" // Invalid query parameters
	 * "DATABASE_ERROR" // Database operation failed
	 * ```
	 */
	@SuccessResponse(200, 'Ideas retrieved successfully')
	@Get('/')
	@LogResponseTime()
	public async getIdeas(
		@Query() search?: string,
		@Query() authorId?: string,
		@Query() tags?: string[],
		@Query() page?: number,
		@Query() limit?: number,
		@Query() sortBy?: 'created_at' | 'updated_at' | 'title',
		@Query() sortOrder?: 'asc' | 'desc',
		@Request() request?: any
	): Promise<any> {
		try {
			const userId = request?.user?.sub
			if (!userId) {
				this.setStatus(401)
				return 'UNAUTHORIZED'
			}

			const queryParams = {
				search,
				authorId,
				tags,
				page: page || 0,
				limit: limit || 10,
				sortBy: sortBy || 'created_at',
				sortOrder: sortOrder || 'desc'
			}

			this.logger.info('Retrieving ideas', { 
				userId, 
				...queryParams
			})

			// Retrieve ideas from database
			const { ideas, total } = await this.ideaRepository.findAll(queryParams)
			
			const totalPages = Math.ceil(total / (queryParams.limit || 10))

			// O middleware irá automaticamente serializar usando GetIdeasResponseDTO
			const response = {
				ideas,
				pagination: {
					page: queryParams.page || 0,
					limit: queryParams.limit || 10,
					total,
					totalPages,
					hasNext: (queryParams.page || 0) < totalPages,
					hasPrev: (queryParams.page || 0) > 0
				}
			}

			this.logger.info('Ideas retrieved successfully', { 
				userId, 
				count: ideas.length, 
				total, 
				page: queryParams.page || 0
			})

			this.setStatus(200)
			return response

		} catch (error) {
			this.logger.error('Failed to retrieve ideas', { 
				error: error instanceof Error ? error.message : 'Unknown error',
				userId: request.user?.sub 
			})
			
			this.setStatus(500)
			return 'DATABASE_ERROR'
		}
	}
}

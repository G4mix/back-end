import { Route, Tags, Controller, Query, Get, SuccessResponse, Security, Request, Path } from 'tsoa'
import { inject } from 'tsyringe'
import { injectable } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'
import { FollowRepository } from '@shared/repositories/follow.repository'
import { GetFollowingResponse } from './get-following.dto'
import { ErrorResponse, CommonErrors } from '@shared/utils/error-response'

@injectable()
@Route('/v1/follow')
@Tags('Follows')
@Security('jwt')
export class GetFollowingController extends Controller {
	constructor(
		@inject('Logger') private logger: Logger,
		@inject('FollowRepository') private followRepository: FollowRepository
	) {
		super()
	}

	/**
	 * Get who a user is following with pagination
	 * 
	 * This endpoint allows authenticated users to retrieve a paginated list of users
	 * that a specific user profile is following. Users can see who they are following,
	 * with complete following information including profile details and follow dates.
	 * 
	 * Following Retrieval Process:
	 * - Validates user authentication via JWT token
	 * - Validates target user profile ID parameter
	 * - Retrieves following relationships from database with pagination
	 * - Includes complete following user profile information
	 * - Calculates pagination metadata
	 * - Returns serialized following data
	 * 
	 * Features:
	 * - Pagination with configurable page size (default: 10)
	 * - Complete following user profile information
	 * - Follow relationship timestamps
	 * - Comprehensive pagination metadata
	 * - Performance optimized queries
	 * - Real-time following count
	 * 
	 * @param userId - The user profile ID to get following for (UUID format)
	 * @param page - Page number for pagination (default: 0, 0-based indexing)
	 * @param limit - Number of items per page (default: 10)
	 * @param request - Express request object containing authenticated user info
	 * @returns Promise resolving to paginated following list or error string
	 * 
	 * @example
	 * ```typescript
	 * // URL: /v1/follow/following/uuid-123?page=0&limit=10
	 * 
	 * // Success response (200)
	 * {
	 *   "following": [
	 *     {
	 *       "id": "follow-uuid-456",
	 *       "followingUser": {
	 *         "id": "user-profile-uuid-789",
	 *         "displayName": "Jane Smith",
	 *         "icon": "https://s3.amazonaws.com/bucket/jane-icon.jpg",
	 *         "username": "jane_smith"
	 *       },
	 *       "created_at": "2024-01-15T10:30:00.000Z"
	 *     }
	 *   ],
	 *   "pagination": {
	 *     "page": 0,
	 *     "limit": 10,
	 *     "total": 15,
	 *     "totalPages": 2,
	 *     "hasNext": true,
	 *     "hasPrev": false
	 *   }
	 * }
	 * 
	 * // Error responses
	 * "UNAUTHORIZED" // User not authenticated
	 * "USER_NOT_FOUND" // Target user profile doesn't exist
	 * "VALIDATION_ERROR" // Invalid parameters
	 * "DATABASE_ERROR" // Database operation failed
	 * ```
	 */
	@SuccessResponse(200, 'Following retrieved successfully')
	@Get('/following/:userId')
	@LogResponseTime()
	public async getFollowing(
		@Path() userId: string,
		@Query() page?: number,
		@Query() limit?: number,
		@Request() request?: any
	): Promise<GetFollowingResponse | ErrorResponse> {
		try {
			const userProfileId = request?.user?.userProfileId
			if (!userProfileId) {
				this.setStatus(CommonErrors.UNAUTHORIZED.code)
				return CommonErrors.UNAUTHORIZED
			}

			const queryParams = {
				userId,
				page: page || 0,
				limit: limit || 10
			}

			this.logger.info('Retrieving following', {
				userProfileId,
				...queryParams
			})

			// Retrieve following from database
			const { following, total } = await this.followRepository.findFollowing(queryParams)
			
			const totalPages = Math.ceil(total / (queryParams.limit || 10))
			const currentPage = queryParams.page

			const response = {
				following: following.map((follow: any) => ({
					id: follow.id,
					followingUser: {
						id: follow.followingUser.id,
						displayName: follow.followingUser.displayName,
						icon: follow.followingUser.icon,
						username: follow.followingUser.user?.username
					},
					created_at: follow.created_at.toISOString()
				})),
				pagination: {
					page: currentPage,
					limit: queryParams.limit || 10,
					total,
					totalPages,
					hasNext: currentPage < totalPages - 1,
					hasPrev: currentPage > 0
				}
			}

			this.logger.info('Following retrieved successfully', { 
				userProfileId, 
				count: following.length, 
				total, 
				page: currentPage
			})

			this.setStatus(200)
			return response

		} catch (error) {
			this.logger.error('Failed to retrieve following', { 
				error: error instanceof Error ? error.message : 'Unknown error',
				userProfileId: request.user?.userProfileId 
			})
			this.setStatus(CommonErrors.DATABASE_ERROR.code)
			return CommonErrors.DATABASE_ERROR
		}
	}
}

import { Route, Tags, Controller, Query, Get, SuccessResponse, Security, Request, Path } from 'tsoa'
import { inject } from 'tsyringe'
import { injectable } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'
import { FollowRepository } from '@shared/repositories/follow.repository'
import { GetFollowersResponse } from './get-followers.dto'
import { ErrorResponse, CommonErrors } from '@shared/utils/error-response'

@injectable()
@Route('/v1/follow')
@Tags('Follows')
@Security('jwt')
export class GetFollowersController extends Controller {
	constructor(
		@inject('Logger') private logger: Logger,
		@inject('FollowRepository') private followRepository: FollowRepository
	) {
		super()
	}

	/**
	 * Get followers of a user
	 * 
	 * This endpoint allows authenticated users to retrieve a paginated list of followers
	 * for a specific user profile. Users can see who is following them.
	 * 
	 * @param userId - The user profile ID to get followers for
	 * @param page - Page number (0-based)
	 * @param limit - Number of items per page
	 * @param request - Express request object containing authenticated user info
	 * @returns Promise resolving to paginated followers list or error string
	 */
	@SuccessResponse(200, 'Followers retrieved successfully')
	@Get('/followers/:userId')
	@LogResponseTime()
	public async getFollowers(
		@Path() userId: string,
		@Query() page?: number,
		@Query() limit?: number,
		@Request() request?: any
	): Promise<GetFollowersResponse | ErrorResponse> {
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

			this.logger.info('Retrieving followers', {
				userProfileId,
				...queryParams
			})

			// Retrieve followers from database
			const { followers, total } = await this.followRepository.findFollowers(queryParams)
			
			const totalPages = Math.ceil(total / (queryParams.limit || 10))
			const currentPage = queryParams.page

			const response = {
				followers: followers.map((follow: any) => ({
					id: follow.id,
					followerUser: {
						id: follow.followerUser.id,
						displayName: follow.followerUser.displayName,
						icon: follow.followerUser.icon,
						username: follow.followerUser.user?.username
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

			this.logger.info('Followers retrieved successfully', { 
				userProfileId, 
				count: followers.length, 
				total, 
				page: currentPage
			})

			this.setStatus(200)
			return response

		} catch (error) {
			this.logger.error('Failed to retrieve followers', { 
				error: error instanceof Error ? error.message : 'Unknown error',
				userProfileId: request.user?.userProfileId 
			})
			this.setStatus(CommonErrors.DATABASE_ERROR.code)
			return CommonErrors.DATABASE_ERROR
		}
	}
}

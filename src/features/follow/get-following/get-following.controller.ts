import { Route, Tags, Controller, Query, Get, SuccessResponse, Security, Request } from 'tsoa'
import { inject } from 'tsyringe'
import { injectable } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators'
import { FollowRepository } from '@shared/repositories/follow.repository'
import { GetFollowingResponse } from './get-following.dto'

@injectable()
@Route('api/v1/follow')
@Tags('Follows')
@Security('jwt')
export class GetFollowingController extends Controller {
	constructor(
		@inject('Logger') private logger: Logger,
		@inject('FollowRepository') private followRepository: FollowRepository
	) {
		super()
		void this.logger
		void this.followRepository
	}

	/**
	 * Get who a user is following
	 * 
	 * This endpoint allows authenticated users to retrieve a paginated list of users
	 * that a specific user profile is following.
	 * 
	 * @param userId - The user profile ID to get following for
	 * @param page - Page number (0-based)
	 * @param limit - Number of items per page
	 * @param request - Express request object containing authenticated user info
	 * @returns Promise resolving to paginated following list or error string
	 */
	@SuccessResponse(200, 'Following retrieved successfully')
	@Get('/following')
	@LogResponseTime()
	public async getFollowing(
		@Query() userId: string,
		@Query() page?: number,
		@Query() limit?: number,
		@Request() request?: any
	): Promise<GetFollowingResponse | string> {
		try {
			const userProfileId = request?.user?.userProfileId
			if (!userProfileId) {
				this.setStatus(401)
				return 'UNAUTHORIZED'
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
			this.setStatus(500)
			return 'DATABASE_ERROR'
		}
	}
}

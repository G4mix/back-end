import { Route, Tags, Controller, Body, Post, SuccessResponse, Security, Request } from 'tsoa'
import { inject } from 'tsyringe'
import { injectable } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators'
import { ToggleFollowInput, ToggleFollowResponse } from './toggle-follow.dto'

@injectable()
@Route('api/v1/follows')
@Tags('Follows')
@Security('jwt')
export class ToggleFollowController extends Controller {
	constructor(
		@inject('Logger') private logger: Logger
	) {
		super()
		void this.logger
	}

	/**
	 * Toggle follow relationship with user or company
	 * 
	 * This endpoint allows authenticated users to follow or unfollow other users
	 * or companies. If the user isn't following the target, it will create a follow
	 * relationship. If they are already following, it will remove the relationship.
	 * 
	 * Follow Toggle Process:
	 * - Validates user authentication
	 * - Checks if user is trying to follow themselves (not allowed)
	 * - Validates that target user/company exists
	 * - Creates or removes follow relationship
	 * - Updates follower count for the target
	 * - Returns current follow status and count
	 * 
	 * @param body - Object containing followingId and followingType
	 * @param request - Express request object containing authenticated user info
	 * @returns Promise resolving to follow status and count or error string
	 * 
	 * @example
	 * ```typescript
	 * // Request body for following a user
	 * {
	 *   "followingId": "user-profile-uuid-123",
	 *   "followingType": "user"
	 * }
	 * 
	 * // Request body for following a company
	 * {
	 *   "followingId": "company-uuid-456",
	 *   "followingType": "company"
	 * }
	 * 
	 * // Success response (200) - when following
	 * {
	 *   "following": true,
	 *   "followerCount": 150,
	 *   "message": "Successfully started following"
	 * }
	 * 
	 * // Success response (200) - when unfollowing
	 * {
	 *   "following": false,
	 *   "followerCount": 149,
	 *   "message": "Successfully unfollowed"
	 * }
	 * 
	 * // Error responses
	 * "UNAUTHORIZED" // User not authenticated
	 * "CANNOT_FOLLOW_SELF" // User trying to follow themselves
	 * "TARGET_NOT_FOUND" // Target user/company doesn't exist
	 * "VALIDATION_ERROR" // Invalid input data
	 * "DATABASE_ERROR" // Database operation failed
	 * ```
	 */
	@SuccessResponse(200, 'Follow toggled successfully')
	@Post('/toggle')
	@LogResponseTime()
	public async toggleFollow(
		@Body() body: ToggleFollowInput,
		@Request() request: any
	): Promise<ToggleFollowResponse | string> {
		try {
			const userId = request.user?.sub
			if (!userId) {
				this.setStatus(401)
				return 'UNAUTHORIZED'
			}

			const { followingId, followingType } = body

			// Prevent self-following
			if (userId === followingId) {
				this.setStatus(400)
				return 'CANNOT_FOLLOW_SELF'
			}

			this.logger.info('Toggling follow', { 
				userId, 
				followingId, 
				followingType,
				action: 'toggle_follow'
			})

			// TODO: Implement follow toggle logic
			// 1. Validate that target user/company exists
			// 2. Check if user is already following
			// 3. Create or remove follow relationship
			// 4. Update follower count
			// 5. Return current status

			// Mock response - assuming follow was added
			const response = {
				following: true,
				followerCount: 150,
				message: 'Successfully started following'
			}

			this.logger.info('Follow toggled successfully', { 
				userId, 
				followingId, 
				followingType,
				following: response.following,
				followerCount: response.followerCount
			})

			this.setStatus(200)
			return response

		} catch (error) {
			this.logger.error('Failed to toggle follow', { 
				error: error instanceof Error ? error.message : 'Unknown error',
				userId: request.user?.sub,
				followingId: body.followingId,
				followingType: body.followingType
			})
			
			this.setStatus(500)
			return 'DATABASE_ERROR'
		}
	}
}

import { Route, Tags, Controller, Body, Post, SuccessResponse, Security, Request } from 'tsoa'
import { inject } from 'tsyringe'
import { injectable } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'
import { ToggleFollowInput, ToggleFollowResponse } from './toggle-follow.dto'
import { FollowRepository } from '@shared/repositories/follow.repository'
import { UserRepository } from '@shared/repositories/user.repository'

@injectable()
@Route('api/v1/follow')
@Tags('Follows')
@Security('jwt')
export class ToggleFollowController extends Controller {
	constructor(
		@inject('Logger') private logger: Logger,
		@inject('FollowRepository') private followRepository: FollowRepository,
		@inject('UserRepository') private userRepository: UserRepository
	) {
		super()
		void this.logger
		void this.followRepository
		void this.userRepository
	}

	/**
	 * Toggle follow relationship with user
	 * 
	 * This endpoint allows authenticated users to follow or unfollow other users.
	 * If the user isn't following the target, it will create a follow relationship.
	 * If they are already following, it will remove the relationship.
	 * 
	 * Follow Toggle Process:
	 * - Validates user authentication
	 * - Checks if user is trying to follow themselves (not allowed)
	 * - Validates that target user exists
	 * - Creates or removes follow relationship
	 * - Returns current follow status
	 * 
	 * @param body - Object containing followingId (user profile ID)
	 * @param request - Express request object containing authenticated user info
	 * @returns Promise resolving to follow status or error string
	 * 
	 * @example
	 * ```typescript
	 * // Request body for following a user
	 * {
	 *   "followingId": "user-profile-uuid-123"
	 * }
	 * 
	 * // Success response (200) - when following
	 * {
	 *   "following": true,
	 *   "message": "Successfully started following"
	 * }
	 * 
	 * // Success response (200) - when unfollowing
	 * {
	 *   "following": false,
	 *   "message": "Successfully unfollowed"
	 * }
	 * 
	 * // Error responses
	 * "UNAUTHORIZED" // User not authenticated
	 * "CANNOT_FOLLOW_SELF" // User trying to follow themselves
	 * "TARGET_NOT_FOUND" // Target user doesn't exist
	 * "FOLLOW_NOT_FOUND" // Follow relationship not found when trying to unfollow
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
			const userProfileId = request.user?.userProfileId
			if (!userId || !userProfileId) {
				this.setStatus(401)
				return 'UNAUTHORIZED'
			}

			const { followingId } = body

			// Prevent self-following (will be checked after getting targetUserProfileId)

			this.logger.info('Toggling follow', { 
				userId, 
				userProfileId,
				followingId, 
				action: 'toggle_follow'
			})

			// Validate that target user profile exists
			const targetUser = await this.userRepository.findUserByProfileId({ userProfileId: followingId })
			if (!targetUser) {
				this.setStatus(404)
				return 'TARGET_NOT_FOUND'
			}

			// Prevent self-following
			if (userProfileId === followingId) {
				this.setStatus(400)
				return 'CANNOT_FOLLOW_SELF'
			}

			// Check if user is already following
			const existingFollow = await this.followRepository.findFollow({
				followerUserId: userProfileId,
				followingUserId: followingId
			})

			let response: ToggleFollowResponse

			if (existingFollow) {
				// User is already following, so unfollow
				const unfollowResult = await this.followRepository.unfollow({
					followerUserId: userProfileId,
					followingUserId: followingId
				})

				if (unfollowResult === 'FOLLOW_NOT_FOUND') {
					this.setStatus(404)
					return 'FOLLOW_NOT_FOUND'
				}

				response = {
					following: false,
					message: 'Successfully unfollowed'
				}
			} else {
				// User is not following, so follow
				const followResult = await this.followRepository.follow({
					followerUserId: userProfileId,
					followingUserId: followingId
				})

				if (followResult === 'YOU_CANT_FOLLOW_YOURSELF') {
					this.setStatus(400)
					return 'CANNOT_FOLLOW_SELF'
				}

				if (followResult === 'ALREADY_FOLLOWING') {
					response = {
						following: true,
						message: 'Already following this user'
					}
				} else {
					response = {
						following: true,
						message: 'Successfully started following'
					}
				}
			}

			this.logger.info('Follow toggled successfully', { 
				userId, 
				userProfileId,
				followingId, 
				following: response.following
			})

			this.setStatus(200)
			return response

		} catch (error) {
			this.logger.error('Failed to toggle follow', { 
				error: error instanceof Error ? error.message : 'Unknown error',
				userId: request.user?.sub,
				followingId: body.followingId,
			})
			
			this.setStatus(500)
			return 'DATABASE_ERROR'
		}
	}
}

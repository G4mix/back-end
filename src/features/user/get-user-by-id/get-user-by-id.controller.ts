import { Route, Tags, Controller, Get, Path, SuccessResponse } from 'tsoa'
import { injectable, inject } from 'tsyringe'
import { UserRepository } from '@shared/repositories/user.repository'
import { Logger } from '@shared/utils/logger'
import { ErrorResponse, CommonErrors } from '@shared/utils/error-response'

@injectable()
@Route('/v1/user')
@Tags('User Management')
export class GetUserByIdController extends Controller {
	constructor(
		@inject('UserRepository') private userRepository: UserRepository,
		@inject('Logger') private logger: Logger
	) {
		super()
		void this.logger
	}

	/**
	 * Retrieve specific user by ID with complete profile information
	 * 
	 * This endpoint retrieves detailed information about a specific user by their ID.
	 * It returns complete user data including profile information, links, and
	 * follower/following counts. Useful for user profiles, user details pages,
	 * and user lookup functionality.
	 * 
	 * Features:
	 * - Complete user profile information
	 * - Social links and connections data
	 * - Follower and following counts
	 * - Serialized user data format
	 * - Proper error handling for non-existent users
	 * 
	 * @param userId - Unique identifier of the user to retrieve
	 * @returns Promise resolving to complete user data or error message
	 * 
	 * @example
	 * ```typescript
	 * // URL: /v1/user/uuid-123
	 * 
	 * // Success response (200)
	 * {
	 *   "id": "uuid-123",
	 *   "username": "john_doe",
	 *   "email": "john@example.com",
	 *   "verified": true,
	 *   "created_at": "2024-01-01T00:00:00.000Z",
	 *   "updated_at": "2024-01-15T10:30:00.000Z",
	 *   "userProfile": {
	 *     "id": "profile-uuid",
	 *     "icon": "https://s3.amazonaws.com/bucket/icon.jpg",
	 *     "displayName": "John Doe",
	 *     "autobiography": "Software developer passionate about technology",
	 *     "backgroundImage": "https://s3.amazonaws.com/bucket/bg.jpg",
	 *     "links": [
	 *       { "id": "link-1", "url": "https://github.com/johndoe", "platform": "github" }
	 *     ],
	 *     "followersCount": 150,
	 *     "followingCount": 75
	 *   }
	 * }
	 * 
	 * // Error response (404)
	 * {
	 *   "message": "USER_NOT_FOUND"
	 * }
	 * ```
	 */
	@SuccessResponse(200, 'User retrieved successfully')
	@Get('/{userId}')
	public async getUserById(@Path() userId: string): Promise<any | ErrorResponse> {
		const user = await this.userRepository.findById({ id: userId })
		
		if (!user) {
			this.setStatus(CommonErrors.USER_NOT_FOUND.code)
			return CommonErrors.USER_NOT_FOUND
		}

		// O middleware irá automaticamente serializar usando GetUserByIdResponseDTO
		return { user }
	}
}

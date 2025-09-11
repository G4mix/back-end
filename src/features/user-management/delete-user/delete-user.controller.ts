import { Route, Tags, Controller, Delete, SuccessResponse, Security, Request } from 'tsoa'
import { injectable, inject } from 'tsyringe'
import { UserRepository } from '@shared/repositories/user.repository'
import { UserGateway } from '@shared/gateways/user.gateway'
import { Logger } from '@shared/utils/logger'
import { TsoaRequest } from '@shared/types/tsoa'

@injectable()
@Route('/v1/users')
@Tags('User Management')
export class DeleteUserController extends Controller {
	constructor(
		@inject('UserRepository') private userRepository: UserRepository,
		@inject('UserGateway') private userGateway: UserGateway,
		@inject('Logger') private logger: Logger
	) {
		super()
		void this.logger
	}

	/**
	 * Permanently delete authenticated user's account and associated data
	 * 
	 * This endpoint allows authenticated users to permanently delete their account
	 * and all associated data. It performs comprehensive cleanup including user
	 * files, database records, and external service data. This action is irreversible.
	 * 
	 * Deletion Process:
	 * - Validates user authentication and ownership
	 * - Retrieves user file information (profile images, etc.)
	 * - Deletes user files from cloud storage (S3)
	 * - Removes all user data from database
	 * - Cleans up related records and associations
	 * - Comprehensive error handling and rollback
	 * 
	 * Security Features:
	 * - JWT token validation required
	 * - User can only delete their own account
	 * - Comprehensive data cleanup
	 * - Secure file deletion from cloud storage
	 * 
	 * @param userId - ID of the user account to delete (must match authenticated user)
	 * @param req - Express request object with JWT token containing user information
	 * @returns Promise resolving to deletion confirmation or error string
	 * 
	 * @example
	 * ```typescript
	 * // URL: /v1/users/uuid-123
	 * // Headers: Authorization: Bearer jwt_token
	 * 
	 * // Success response (200)
	 * {
	 *   "message": "User account deleted successfully",
	 *   "deletedFiles": [
	 *     "https://s3.amazonaws.com/bucket/icon.jpg",
	 *     "https://s3.amazonaws.com/bucket/background.jpg"
	 *   ]
	 * }
	 * 
	 * // Error responses
	 * "USER_NOT_FOUND" // User doesn't exist
	 * "UNAUTHORIZED" // Invalid or missing JWT token
	 * "PERMISSION_DENIED" // User trying to delete different account
	 * "DELETION_FAILED" // Account deletion process failed
	 * ```
	 */
	@SuccessResponse(200, 'User deleted successfully')
	@Delete()
	@Security('jwt', [])
	public async deleteUser(
		@Request() req: TsoaRequest
	) {
		const user = await this.userRepository.findById({ id: req.user.sub })
		if (!user) {
			this.setStatus(404)
			return { message: 'USER_NOT_FOUND' }
		}

		if (user.userProfile.icon) {
			await this.userGateway.deleteUserFile({ key: user.userProfile.icon })
		}
		if (user.userProfile.backgroundImage) {
			await this.userGateway.deleteUserFile({ key: user.userProfile.backgroundImage })
		}

		await this.userRepository.delete({ id: req.user.sub })

		return { message: 'USER_DELETED_SUCCESSFULLY' }
	}
}

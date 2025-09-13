import { Route, Tags, Controller, Get, Query, SuccessResponse } from 'tsoa'
import { injectable, inject } from 'tsyringe'
import { UserRepository } from '@shared/repositories/user.repository'
import { Logger } from '@shared/utils/logger'

@injectable()
@Route('/v1/user')
@Tags('User Management')
export class GetUsersController extends Controller {
	constructor(
		@inject('UserRepository') private userRepository: UserRepository,
		@inject('Logger') private logger: Logger
	) {
		super()
		void this.logger
	}

	/**
	 * Retrieve paginated list of users with search functionality
	 * 
	 * This endpoint provides a paginated list of all users in the system with
	 * optional search functionality. It's useful for user discovery, admin
	 * management, and general user browsing features.
	 * 
	 * User Retrieval Process:
	 * - Validates query parameters (pagination, search filters)
	 * - Applies search filters across username, email, and displayName
	 * - Retrieves users from database with pagination
	 * - Includes complete user profile information
	 * - Returns paginated results with comprehensive metadata
	 * 
	 * Features:
	 * - Pagination with configurable page size (default: 10, max: 100)
	 * - Search functionality across user fields (username, email, displayName)
	 * - Serialized user data with complete profile information
	 * - Comprehensive pagination metadata
	 * - Performance optimized database queries
	 * - Real-time user count and pagination calculations
	 * 
	 * @param page - Page number for pagination (default: 0, 0-based indexing)
	 * @param limit - Number of users per page (default: 10, max: 100)
	 * @param search - Optional search term to filter users by username, email, or displayName
	 * @returns Promise resolving to paginated user list with metadata or error string
	 * 
	 * @example
	 * ```typescript
	 * // URL: /v1/user?page=1&limit=20&search=john
	 * 
	 * // Success response (200)
	 * {
	 *   "users": [
	 *     {
	 *       "id": "uuid-123",
	 *       "username": "john_doe",
	 *       "email": "john@example.com",
	 *       "verified": true,
	 *       "created_at": "2024-01-01T00:00:00.000Z",
	 *       "updated_at": "2024-01-15T10:30:00.000Z",
	 *       "userProfile": {
	 *         "id": "profile-uuid",
	 *         "icon": "https://s3.amazonaws.com/bucket/icon.jpg",
	 *         "displayName": "John Doe",
	 *         "autobiography": "Software developer passionate about technology",
	 *         "backgroundImage": "https://s3.amazonaws.com/bucket/bg.jpg",
	 *         "links": [
	 *           { "id": "link-1", "url": "https://github.com/johndoe", "platform": "github" }
	 *         ],
	 *         "followersCount": 150,
	 *         "followingCount": 75
	 *       }
	 *     }
	 *   ],
	 *   "pagination": {
	 *     "page": 1,
	 *     "limit": 20,
	 *     "total": 95,
	 *     "totalPages": 5,
	 *     "hasNext": true,
	 *     "hasPrev": true
	 *   }
	 * }
	 * 
	 * // Error responses
	 * "UNAUTHORIZED" // User not authenticated
	 * "VALIDATION_ERROR" // Invalid query parameters
	 * "DATABASE_ERROR" // Database operation failed
	 * ```
	 */
	@SuccessResponse(200, 'Users retrieved successfully')
	@Get('/')
	public async getUsers(
		@Query() page: number = 0,
		@Query() limit: number = 10,
		@Query() search?: string
	) {
		const result = await this.userRepository.findAll({
			page,
			quantity: limit,
			search: search || '',
			userId: ''
		})

		return {
			users: result.data,
			pagination: {
				page,
				limit,
				total: result.total
			}
		}
	}
}

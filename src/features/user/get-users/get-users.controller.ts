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
	 * Features:
	 * - Pagination with configurable page size
	 * - Search functionality across user fields
	 * - Serialized user data with profile information
	 * - Comprehensive pagination metadata
	 * - Performance optimized queries
	 * 
	 * @param page - Page number for pagination (default: 0)
	 * @param limit - Number of users per page (default: 10)
	 * @param search - Optional search term to filter users
	 * @returns Promise resolving to paginated user list with metadata
	 * 
	 * @example
	 * ```typescript
	 * // URL: /v1/user?page=1&limit=20&search=john
	 * 
	 * // Success response (200)
	 * {
	 *   "users": [
	 *     {
	 *       "id": "uuid",
	 *       "username": "john_doe",
	 *       "email": "john@example.com",
	 *       "verified": true,
	 *       "userProfile": {
	 *         "id": "uuid",
	 *         "icon": "https://s3.amazonaws.com/bucket/icon.jpg",
	 *         "displayName": "John Doe",
	 *         "autobiography": "Software developer",
	 *         "links": [...]
	 *       }
	 *     }
	 *   ],
	 *   "pagination": {
	 *     "currentPage": 1,
	 *     "totalPages": 5,
	 *     "totalUsers": 95,
	 *     "usersPerPage": 20,
	 *     "hasNextPage": true,
	 *     "hasPreviousPage": false
	 *   }
	 * }
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

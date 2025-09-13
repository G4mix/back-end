import { Route, Tags, Controller, Query, Get, SuccessResponse, Security, Request } from 'tsoa'
import { inject, injectable } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'
import { CommentRepository } from '@shared/repositories/comment.repository'
import { GetCommentsResponse } from './get-comments.dto'
import { ErrorResponse, CommonErrors } from '@shared/utils/error-response'

@injectable()
@Route('/v1/comment')
@Tags('Comment')
@Security('jwt')
export class GetCommentsController extends Controller {
	constructor(
		@inject('Logger') private logger: Logger,
		@inject('CommentRepository') private commentRepository: CommentRepository
	) {
		super()
	}

	/**
	 * Get comments for an idea with pagination
	 *
	 * This endpoint allows authenticated users to retrieve comments for a specific idea.
	 * Comments are returned in a paginated format and can be filtered by parent comment.
	 *
	 * @param ideaId The unique identifier of the idea to get comments for.
	 * @param page Optional page number for pagination (default: 1).
	 * @param limit Optional number of items per page (default: 10, max: 100).
	 * @param parentCommentId Optional ID of parent comment to get replies (for nested comments).
	 * @param request The Express request object, containing user authentication details.
	 * @returns A paginated list of comments or an error message.
	 * @example query
	 * {
	 *   "ideaId": "uuid-of-idea",
	 *   "page": 0,
	 *   "limit": 10,
	 *   "parentCommentId": "uuid-of-parent-comment"
	 * }
	 * @example response-200
	 * {
	 *   "comments": [
	 *     {
	 *       "id": "uuid-of-comment",
	 *       "content": "This is a great idea!",
	 *       "ideaId": "uuid-of-idea",
	 *       "parentCommentId": null,
	 *       "authorId": "uuid-of-user-profile",
	 *       "author": {
	 *         "id": "uuid-of-user-profile",
	 *         "displayName": "John Doe",
	 *         "icon": "https://example.com/icon.jpg"
	 *       },
	 *       "created_at": "2023-10-27T10:00:00Z",
	 *       "updated_at": "2023-10-27T10:00:00Z",
	 *       "_count": {
	 *         "likes": 5,
	 *         "replies": 2
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
	 * @example response-401
	 * "UNAUTHORIZED"
	 * @example response-500
	 * "Failed to retrieve comments"
	 */
	@SuccessResponse(200, 'Comments retrieved successfully')
	@Get('/')
	@LogResponseTime()
	public async getComments(
		@Query() ideaId: string,
		@Query() page?: number,
		@Query() limit?: number,
		@Query() parentCommentId?: string,
		@Request() request?: any
	): Promise<GetCommentsResponse | ErrorResponse> {
		try {
			const userProfileId = request?.user?.userProfileId
			if (!userProfileId) {
				this.setStatus(CommonErrors.UNAUTHORIZED.code)
				return CommonErrors.UNAUTHORIZED
			}

			const queryParams = {
				ideaId,
				page: page || 0, // Repository expects 0-based page
				limit: limit || 10,
				parentCommentId
			}

			this.logger.info('Retrieving comments', {
				userProfileId,
				...queryParams
			})

			// Retrieve comments from database
			const { comments, total } = await this.commentRepository.findByIdea(queryParams)
			
			const totalPages = Math.ceil(total / (queryParams.limit || 10))
			const currentPage = (page || 0)

			const response = {
				comments: comments.map((comment: any) => ({
					id: comment.id,
					content: comment.content,
					ideaId: comment.ideaId,
					parentCommentId: comment.parentCommentId,
					authorId: comment.authorId,
					author: {
						id: comment.author.id,
						displayName: comment.author.displayName,
						icon: comment.author.icon
					},
					created_at: comment.created_at.toISOString(),
					updated_at: comment.updated_at.toISOString(),
					_count: comment._count
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

			this.logger.info('Comments retrieved successfully', { 
				userProfileId, 
				count: comments.length, 
				total, 
				page: currentPage
			})

			this.setStatus(200)
			return response

		} catch (error) {
			this.logger.error('Failed to retrieve comments', { 
				error: error instanceof Error ? error.message : 'Unknown error',
				userProfileId: request.user?.userProfileId 
			})
			this.setStatus(CommonErrors.DATABASE_ERROR.code)
			return CommonErrors.DATABASE_ERROR
		}
	}
}

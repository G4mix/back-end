import { Route, Tags, Controller, Get, SuccessResponse, Security, Request, Query } from 'tsoa'
import { inject } from 'tsyringe'
import { injectable } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'
import { LinkRepository } from '@shared/repositories/link.repository'
import { GetLinksResponse } from './get-links.dto'

@injectable()
@Route('api/v1/user/links')
@Tags('User Links')
@Security('jwt')
export class GetLinksController extends Controller {
	constructor(
		@inject('Logger') private logger: Logger,
		@inject('LinkRepository') private linkRepository: LinkRepository
	) {
		super()
		void this.logger
		void this.linkRepository
	}

	/**
	 * Get personal links of a user
	 * 
	 * This endpoint allows authenticated users to retrieve their personal links
	 * or view another user's public links.
	 * 
	 * @param userId - Optional user profile ID to get links for (defaults to current user)
	 * @param request - Express request object containing authenticated user info
	 * @returns Promise resolving to links list or error string
	 */
	@SuccessResponse(200, 'Links retrieved successfully')
	@Get('/')
	@LogResponseTime()
	public async getLinks(
		@Query() userId?: string,
		@Request() request?: any
	): Promise<GetLinksResponse | string> {
		try {
			const userProfileId = request?.user?.userProfileId
			if (!userProfileId) {
				this.setStatus(401)
				return 'UNAUTHORIZED'
			}

			const targetUserId = userId || userProfileId

			this.logger.info('Retrieving personal links', { 
				userProfileId, 
				targetUserId
			})

			// Retrieve links from database
			const links = await this.linkRepository.findByUser({ userProfileId: targetUserId })

			const response = {
				links: links.map((link: any) => ({
					id: link.id,
					url: link.url,
					created_at: link.created_at.toISOString()
				}))
			}

			this.logger.info('Links retrieved successfully', { 
				userProfileId, 
				targetUserId,
				count: links.length
			})

			this.setStatus(200)
			return response

		} catch (error) {
			this.logger.error('Failed to retrieve links', { 
				error: error instanceof Error ? error.message : 'Unknown error',
				userProfileId: request.user?.userProfileId 
			})
			this.setStatus(500)
			return 'DATABASE_ERROR'
		}
	}
}

import { Route, Tags, Controller, Delete, SuccessResponse, Security, Request, Path } from 'tsoa'
import { inject } from 'tsyringe'
import { injectable } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators'
import { LinkRepository } from '@shared/repositories'

@injectable()
@Route('api/v1/user/links')
@Tags('User Links')
@Security('jwt')
export class RemoveLinkController extends Controller {
	constructor(
		@inject('Logger') private logger: Logger,
		@inject('LinkRepository') private linkRepository: LinkRepository
	) {
		super()
		void this.logger
		void this.linkRepository
	}

	/**
	 * Remove a personal link from user profile
	 * 
	 * This endpoint allows authenticated users to remove personal links from their profile.
	 * Only the owner of the link can remove it.
	 * 
	 * @param linkId - The ID of the link to remove
	 * @param request - Express request object containing authenticated user info
	 * @returns Promise resolving to success message or error string
	 */
	@SuccessResponse(200, 'Link removed successfully')
	@Delete('/{linkId}')
	@LogResponseTime()
	public async removeLink(
		@Path() linkId: string,
		@Request() request: any
	): Promise<string> {
		try {
			const userProfileId = request.user?.userProfileId
			if (!userProfileId) {
				this.setStatus(401)
				return 'UNAUTHORIZED'
			}

			this.logger.info('Removing personal link', { 
				userProfileId, 
				linkId
			})

			// Check if link exists and belongs to user
			const existingLink = await this.linkRepository.findByUserAndId({
				linkId,
				userProfileId
			})

			if (!existingLink) {
				this.setStatus(404)
				return 'LINK_NOT_FOUND'
			}

			// Remove link from database
			await this.linkRepository.delete({ id: linkId })

			this.logger.info('Link removed successfully', { 
				linkId, 
				userProfileId 
			})

			this.setStatus(200)
			return 'Link removed successfully'

		} catch (error) {
			this.logger.error('Failed to remove link', { 
				error: error instanceof Error ? error.message : 'Unknown error',
				userProfileId: request.user?.userProfileId,
				linkId
			})
			
			this.setStatus(500)
			return 'DATABASE_ERROR'
		}
	}
}

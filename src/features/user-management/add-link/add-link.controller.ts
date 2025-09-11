import { Route, Tags, Controller, Body, Post, SuccessResponse, Security, Request } from 'tsoa'
import { inject } from 'tsyringe'
import { injectable } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'
import { LinkRepository } from '@shared/repositories/link.repository'
import { AddLinkInput, AddLinkResponse } from './add-link.dto'

@injectable()
@Route('/v1/user/links')
@Tags('User Links')
@Security('jwt')
export class AddLinkController extends Controller {
	constructor(
		@inject('Logger') private logger: Logger,
		@inject('LinkRepository') private linkRepository: LinkRepository
	) {
		super()
		void this.logger
		void this.linkRepository
	}

	/**
	 * Add a personal link to user profile
	 * 
	 * This endpoint allows authenticated users to add personal links to their profile.
	 * Links can be social media profiles, websites, portfolios, etc.
	 * 
	 * @param body - Object containing the link URL
	 * @param request - Express request object containing authenticated user info
	 * @returns Promise resolving to created link data or error string
	 */
	@SuccessResponse(201, 'Link added successfully')
	@Post('/')
	@LogResponseTime()
	public async addLink(
		@Body() body: AddLinkInput,
		@Request() request: any
	): Promise<AddLinkResponse | string> {
		try {
			const userProfileId = request.user?.userProfileId
			if (!userProfileId) {
				this.setStatus(401)
				return 'UNAUTHORIZED'
			}

			const { url } = body

			this.logger.info('Adding personal link', { 
				userProfileId, 
				url
			})

			// Create link in database
			const newLink = await this.linkRepository.create({
				url,
				userProfileId
			})

			this.logger.info('Link added successfully', { 
				linkId: newLink.id, 
				userProfileId 
			})

			this.setStatus(201)
			return { 
				link: {
					id: newLink.id,
					url: newLink.url,
					created_at: new Date().toISOString()
				}
			}

		} catch (error) {
			this.logger.error('Failed to add link', { 
				error: error instanceof Error ? error.message : 'Unknown error',
				userProfileId: request.user?.userProfileId,
				url: body.url
			})
			
			this.setStatus(500)
			return 'DATABASE_ERROR'
		}
	}
}

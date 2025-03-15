import { Route, Tags, Controller, SuccessResponse, Request, Security, Get, Query } from 'tsoa'
import { injectable } from 'tsyringe'
import { TsoaRequest } from 'src/types/tsoa'
import { ViewService } from '@service'

@injectable()
@Route('api/v1/view')
@Tags('View')
export class ViewController extends Controller {
	constructor(private viewService: ViewService) {
		super()
	}

	/**
	 * View a post of the system
	 *
	 */
	@SuccessResponse(200)
	@Get()
	@Security('jwt', [])
	public async viewPost(
		@Request() req: TsoaRequest,
		@Query() postId: string
	) {
		return await this.viewService.viewPost({ userProfileId: req.user.userProfileId, postId })
	}
}
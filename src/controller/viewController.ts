import { Route, Tags, Controller, SuccessResponse, Request, Security, Body, Post } from 'tsoa'
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
	@Post()
	@Security('jwt', [])
	public async viewPost(
		@Request() req: TsoaRequest,
		@Body() body: { posts: string[] }
	) {
		return await this.viewService.viewPosts({ userProfileId: req.user.userProfileId, posts: body.posts })
	}
}
import { Route, Tags, Controller, SuccessResponse, Request, Security, Get, Query, Post } from 'tsoa'
import { injectable } from 'tsyringe'
import { TsoaRequest } from 'src/types/tsoa'
import { FollowService } from '@service/followService'

@injectable()
@Route('api/v1/follow')
@Tags('Follow')
export class FollowController extends Controller {
	constructor(private followService: FollowService) {
		super()
	}
	
	/**
	 * Follow an user of the system
	 *
	 */
	@SuccessResponse(200)
	@Post()
	@Security('jwt', [])
	public async follow(@Request() req: TsoaRequest, @Query() wantFollow: boolean, @Query() followingTeamId?: string, @Query() followingUserId?: string) {
		return wantFollow
			? await this.followService.follow({ userId: req.user.sub, followingTeamId, followingUserId })
			: await this.followService.unfollow({ userId: req.user.sub, followingTeamId, followingUserId })
	}

	/**
	 * Get all follows of an user of the system
	 *
	 */
	@SuccessResponse(204)
	@Get()
	@Security('jwt', [])
	public async findAll(@Request() req: TsoaRequest, @Query() page: number, @Query() quantity: number, @Query() followType: 'followers:user' | 'followers:team' | 'following') {
		return await this.followService.findAll({ userId: req.user.sub, page, quantity, followType })
	}
}
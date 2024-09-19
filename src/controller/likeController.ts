import { Route, Tags, Controller, SuccessResponse, Request, Security, Get, Query } from 'tsoa'
import { injectable } from 'tsyringe'
import { TsoaRequest } from 'src/types/tsoa'
import { LikeService } from '@service'

@injectable()
@Route('api/v1/like')
@Tags('User')
export class LikeController extends Controller {
	constructor(private likeService: LikeService) {
		super()
	}

	/**
	 * Like or unlike a post of an user
	 *
	 */
	@SuccessResponse(200)
	@Get('/post')
	@Security('jwt', [])
	public async likePost(
        @Request() req: TsoaRequest,
        @Query() isLiked: boolean,
        @Query() postId: string
	) {
		return await this.likeService.likePost({
			userProfileId: req.user.user.userProfile.id, postId, isLiked
		})
	}

	/**
	 * Like or unlike a comment of an user
	 *
	 */
	@SuccessResponse(200)
	@Get('/comment')
	@Security('jwt', [])
	public async likeComment(
        @Request() req: TsoaRequest,
        @Query() isLiked: boolean,
        @Query() commentId: string
	) {
		return await this.likeService.likeComment({
			userProfileId: req.user.user.userProfile.id, commentId, isLiked
		})
	}
}
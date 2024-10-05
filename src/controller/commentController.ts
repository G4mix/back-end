import { Route, Tags, Controller, SuccessResponse, Request, Security, Post, Query, Body } from 'tsoa'
import { CommentService } from '@service'
import { TsoaRequest } from 'src/types/tsoa'
import { injectable } from 'tsyringe'

@injectable()
@Route('api/v1/comment')
@Tags('Comment')
export class CommentController extends Controller {
	constructor(private commentService: CommentService) {
		super()
	}

	/**
	 * Comment in a post
	 *
	 */
	@SuccessResponse(200)
	@Post('/post')
	@Security('jwt', [])
	public async commentPost(
        @Request() req: TsoaRequest,
        @Query() postId: string,
				@Body() { content }: { content: string; }
	) {
		return await this.commentService.commentPost({
			userProfileId: req.user.user.userProfile.id, postId, content
		})
	}

	/**
	 * Reply a comment
	 *
	 */
	@SuccessResponse(200)
	@Post('/comment')
	@Security('jwt', [])
	public async replyPost(
        @Request() req: TsoaRequest,
        @Query() commentId: string,
				@Body() { content }: { content: string; }
	) {
		return await this.commentService.replyComment({
			userProfileId: req.user.user.userProfile.id, commentId, content
		})
	}
}
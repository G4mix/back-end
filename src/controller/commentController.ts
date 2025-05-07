import { Route, Tags, Controller, SuccessResponse, Request, Security, Post, Body, Middlewares, Get, Query } from 'tsoa'
import { schemaValidation } from '@middlewares'
import { RequestHandler } from 'express'
import { CommentService } from '@service'
import { commentSchema } from '@schemas'
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
	 * Comment in a post or in a comment
	 *
	 */
	@SuccessResponse(200)
	@Post()
	@Security('jwt', [])
	@Middlewares<RequestHandler>(schemaValidation(commentSchema))
	public async commentPost(
        @Request() req: TsoaRequest,
				@Body() body: { content: string; },
				@Query() commentId?: string,
				@Query() postId?: string
	) {
		return await this.commentService.comment({
			userProfileId: req.user.userProfileId, postId, commentId, content: body.content
		})
	}

	/**
	 * List comments of a post or replies of a comment
	 *
	 */
	@SuccessResponse(200)
	@Get()
	@Security('jwt', [])
	@Middlewares<RequestHandler>(schemaValidation(commentSchema))
	public async listComments(
		@Query() page: number,
		@Query() quantity: number,
		@Query() commentId?: string,
		@Query() postId?: string
	) {
		return await this.commentService.listComments({ postId, commentId, page, quantity })
	}
}
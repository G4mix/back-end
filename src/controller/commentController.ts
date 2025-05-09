import { Route, Tags, Controller, SuccessResponse, Request, Security, Post, Body, Middlewares, Get, Query, Path } from 'tsoa'
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
				@Query() postId: string,
				@Query() commentId?: string
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
		@Query() since: string,
		@Query() postId: string,
		@Query() commentId?: string
	) {
		return await this.commentService.listComments({ postId, commentId, page, quantity, since })
	}

	/**
	 * Find a comment of the platform by id
	 *
	 */
	@SuccessResponse(200)
	@Get('/{commentId}')
	@Security('jwt', [])
	@Middlewares<RequestHandler>(schemaValidation(commentSchema))
	public async findCommentById(
		@Path() commentId: string
	) {
		return await this.commentService.findCommentById({ commentId })
	}
}
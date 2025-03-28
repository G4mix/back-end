import { Route, Tags, Controller, SuccessResponse, Request, Security, Post, Body, Middlewares, Path, Get, Query } from 'tsoa'
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
	 * Comment in a post
	 *
	 */
	@SuccessResponse(200)
	@Post('/post/{postId}')
	@Security('jwt', [])
	@Middlewares<RequestHandler>(schemaValidation(commentSchema))
	public async commentPost(
        @Request() req: TsoaRequest,
        @Path() postId: string,
				@Body() body: { content: string; }
	) {
		return await this.commentService.commentPost({
			userProfileId: req.user.userProfileId, postId, content: body.content
		})
	}

	/**
	 * Reply a comment
	 *
	 */
	@SuccessResponse(200)
	@Post('/{commentId}')
	@Security('jwt', [])
	@Middlewares<RequestHandler>(schemaValidation(commentSchema))
	public async replyPost(
        @Request() req: TsoaRequest,
        @Path() commentId: string,
				@Body() body: { content: string; }
	) {
		return await this.commentService.replyComment({
			userProfileId: req.user.userProfileId, commentId, content: body.content
		})
	}

	/**
	 * List comments of a post
	 *
	 */
	@SuccessResponse(200)
	@Get('/post/{postId}')
	@Security('jwt', [])
	@Middlewares<RequestHandler>(schemaValidation(commentSchema))
	public async listComments(
        @Path() postId: string,
        @Query() page: number,
        @Query() quantity: number
	) {
		return await this.commentService.listComments({ postId, page, quantity })
	}

	/**
	 * List replies of a comment
	 *
	 */
	@SuccessResponse(200)
	@Get('/{commentId}')
	@Security('jwt', [])
	@Middlewares<RequestHandler>(schemaValidation(commentSchema))
	public async listReplies(
        @Path() commentId: string,
        @Query() page: number,
        @Query() quantity: number
	) {
		return await this.commentService.listReplies({ commentId, page, quantity })
	}
}
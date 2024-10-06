import { Route, Tags, Controller, SuccessResponse, Request, Security, Query, Delete, Get, Path, Post, FormField, UploadedFiles, Patch, Middlewares } from 'tsoa'
import { injectable } from 'tsyringe'
import { TsoaRequest } from 'src/types/tsoa'
import { PostService } from '@service'
import { ControllerUtils } from '@utils'
import { RequestHandler } from 'express'
import { postSchema } from '@schemas'
import { schemaValidation } from '@middlewares'

@injectable()
@Route('api/v1/post')
@Tags('Post')
export class PostController extends Controller {
	constructor(private postService: PostService) {
		super()
	}

	/**
	 * Create a post in the system
	 *
	 */
	@SuccessResponse(200)
	@Post()
	@Security('jwt', [])
	@Middlewares<RequestHandler>(schemaValidation(postSchema))
	public async createPost(
		@Request() req: TsoaRequest,
		@FormField() title?: string,
		@FormField() content?: string,
		@FormField() links?: string[],
		@FormField() tags?: string[],
		@UploadedFiles() images?: Express.Multer.File[]
	) {
		return ControllerUtils.handleResponse(
			await this.postService.createPost({
				userProfileId: req.user.user.userProfile.id, title, content, links, tags, images
			}),
			this
		)
	}

	/**
	 * Update a post in the system
	 *
	 */
	@SuccessResponse(200)
	@Patch()
	@Security('jwt', [])
	@Middlewares<RequestHandler>(schemaValidation(postSchema))
	public async updatePost(
		@Request() req: TsoaRequest,
		@Query() postId: string,
		@FormField() title?: string,
		@FormField() content?: string,
		@FormField() links?: string[],
		@FormField() tags?: string[],
		@UploadedFiles() images?: Express.Multer.File[]
	) {
		return ControllerUtils.handleResponse(
			await this.postService.updatePost({
				userProfileId: req.user.user.userProfile.id, postId, title, content, links, tags, images
			}),
			this
		)
	}

	/**
	 * Find all posts of an user
	 *
	 */
	@SuccessResponse(200)
	@Get()
	@Security('jwt', [])
	public async findAllPosts(
        @Query() page: number,
        @Query() quantity: number,
        @Query() userProfileId?: string
	) {
		return ControllerUtils.handleResponse(
			await this.postService.findAllPosts({
				page,
				quantity,
				userProfileId
			}), this
		)
	}

	/**
	 * Find a post of an user
	 *
	 */
	@SuccessResponse(200)
	@Get('/{postId}')
	@Security('jwt', [])
	public async findPostById(
        @Path() postId: string
	) {
		return ControllerUtils.handleResponse(await this.postService.findPostById({ postId }), this)
	}

	/**
	 * Delete a post of an user
	 *
	 */
	@SuccessResponse(200)
	@Delete()
	@Security('jwt', [])
	public async deletePost(
        @Request() req: TsoaRequest,
        @Query() postId: string
	) {
		return ControllerUtils.handleResponse(
			await this.postService.deletePost({
				userProfileId: req.user.user.userProfile.id, postId
			}), this
		)
	}
}
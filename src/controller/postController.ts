import { Route, Tags, Controller, SuccessResponse, Request, Security, Query, Delete, Get, Path, Post, FormField, UploadedFiles } from 'tsoa'
import { injectable } from 'tsyringe'
import { TsoaRequest } from 'src/types/tsoa'
import { PostService } from '@service'
import { ControllerUtils } from '@utils'

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
	public async createPost(
		@FormField() title: string,
		@FormField() content: string,
		@FormField() links: string[],
		@FormField() tags: string[],
		@UploadedFiles() images?: Express.Multer.File[]
	) {
		return ControllerUtils.handleResponse(
			await this.postService.createPost({
				title, content, links, tags, images
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
		return ControllerUtils.handleResponse(await this.postService.findAllPosts({ page, quantity, userProfileId }), this)
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
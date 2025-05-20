import { Route, Tags, Controller, SuccessResponse, Patch, Request, Security, Delete, UploadedFile, FormField, Middlewares, Get, Path, Query } from 'tsoa'
import { injectable } from 'tsyringe'
import { UserService } from '@service'
import { TsoaRequest } from 'src/types/tsoa'
import { ControllerUtils } from '@utils'
import { RequestHandler } from 'express'
import { schemaValidation } from '@middlewares'
import { updateUserSchema } from '@schemas'

@injectable()
@Route('api/v1/user')
@Tags('User')
export class UserController extends Controller {
	constructor(private userService: UserService) {
		super()
	}

	/**
	 * Verify if exists an user with the email in the system
	 *
	 */
	@SuccessResponse(200)
	@Get()
	@Security('jwt', [])
	public async findAll(@Request() req: TsoaRequest, @Query() search: string, @Query() page: number, @Query() quantity: number) {
		return await this.userService.findAll({ search: search.toLocaleLowerCase(), userId: req.user.sub, page, quantity })
	}

	/**
	 * Get data from an user of the system
	 *
	 */
	@SuccessResponse(200)
	@Get('/data')
	@Security('jwt', [])
	public async findByToken(@Request() req: TsoaRequest) {
		return await this.userService.findByToken({ id: req.user.sub })
	}

	/**
	 * Verify if exists an user with the email in the system
	 *
	 */
	@SuccessResponse(200)
	@Get('/exists/{email}')
	public async get(@Path() email: string) {
		const res = await this.userService.existsByEmail({ email: email.toLowerCase() })
		if (typeof res === 'string') return ControllerUtils.handleResponse(res, this)
		return res
	}

	/**
	 * Update the user in the system
	 *
	 */
	@SuccessResponse(200)
	@Patch()
	@Security('jwt', [])
	@Middlewares<RequestHandler>(schemaValidation(updateUserSchema))
	public async update(
		@Request() req: TsoaRequest,
		@FormField() username?: string,
		@FormField() email?: string,
		@FormField() password?: string,
		@UploadedFile() icon?: Express.Multer.File
	) {
		const data: { id: string; username?: string; password?: string; icon?: Express.Multer.File; email?: string; } = {
			id: req.user.sub, username, password, icon
		}
		if (email) data['email'] = email.toLowerCase()
		const res = await this.userService.update(data)
		if (typeof res === 'string') return ControllerUtils.handleResponse(res, this)
		return res
	}

	/**
	 * Delete the user of the system
	 *
	 */
	@SuccessResponse(204)
	@Delete()
	@Security('jwt', [])
	public async delete(@Request() req: TsoaRequest) {
		await this.userService.delete({ id: req.user.sub })
	}
}
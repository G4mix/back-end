import { Route, Tags, Controller, SuccessResponse, Patch, Request, Security, Delete, UploadedFile, FormField, Middlewares } from 'tsoa'
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
		const data = {
			id: req.user.sub, username, email, password, icon
		}
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
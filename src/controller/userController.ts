import { Route, Tags, Controller, SuccessResponse, Patch, Request, Security, Delete, UploadedFile, FormField } from 'tsoa'
import { injectable } from 'tsyringe'
import { UserService } from '@service'
import { TsoaRequest } from 'src/types/tsoa'
import { ControllerUtils } from '@utils'

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
		this.setHeader('Authorization', `Bearer ${res.token}`)
		return
	}

	/**
	 * Delete the user of the system
	 *
	 */
	@SuccessResponse(200)
	@Delete()
	@Security('jwt', [])
	public async delete(@Request() req: TsoaRequest) {
		const res = await this.userService.delete({ id: req.user.sub })
		if (typeof res === 'string') return ControllerUtils.handleResponse(res, this)
		return res
	}
}
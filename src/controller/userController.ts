import { Route, Tags, Controller, Body, SuccessResponse, Patch, Request, Security, Delete } from 'tsoa'
import { injectable } from 'tsyringe'
import { UserService } from '@service/userService'
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
		@Body() body: {
			username?: string;
			email?: string;
			password?: string;
		}
	) {
		const data = {
			id: req.user.sub, ...body
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
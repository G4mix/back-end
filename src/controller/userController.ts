import { Route, Tags, Controller, Body, SuccessResponse, Patch, Request, Security } from 'tsoa'
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
	 * Signup the user in the system
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
}
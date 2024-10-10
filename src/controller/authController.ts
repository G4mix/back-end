import { Route, Tags, Controller, Body, Post, SuccessResponse } from 'tsoa'
import { AuthService } from '@service'
import { injectable } from 'tsyringe'
import { AuthInput } from 'src/types/auth'
import { ControllerUtils } from '@utils'

@injectable()
@Route('api/v1/auth')
@Tags('Authentication')
export class AuthController extends Controller {
	constructor(private authService: AuthService) {
		super()
	}

	/**
	 * Signup the user in the system
	 *
	 */
	@SuccessResponse(201)
	@Post('/signup')
	public async signup(@Body() body: AuthInput) {
		const res = await this.authService.signup(body)
		if (typeof res === 'string') return ControllerUtils.handleResponse(res, this)
		this.setHeader('Authorization', `Bearer ${res.token}`)
		return
	}

	/**
	 * Signin the user in the system
	 *
	 */
	@SuccessResponse(200)
	@Post('/signin')
	public async signin(@Body() body: Pick<AuthInput, 'email' | 'password'>) {
		const res = await this.authService.signin(body)
		if (typeof res === 'string') return ControllerUtils.handleResponse(res, this)
		this.setHeader('Authorization', `Bearer ${res.token}`)
		return
	}
}
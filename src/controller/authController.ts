import { Route, Tags, Controller, Body, Post, SuccessResponse, Middlewares } from 'tsoa'
import { AuthService } from '@service'
import { injectable } from 'tsyringe'
import { AuthInput } from 'src/types/auth'
import { ControllerUtils } from '@utils'
import { userSignUpSchema } from '@schemas'
import { schemaValidation } from '@middlewares'
import { RequestHandler } from 'express'

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
	@Middlewares<RequestHandler>(schemaValidation(userSignUpSchema))
	public async signup(@Body() body: AuthInput) {
		const res = await this.authService.signup(body)
		if (typeof res === 'string') return ControllerUtils.handleResponse(res, this)
		return res
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
		return res
	}

	/**
	 * Refresh the user session in the system
	 *
	 */
	@SuccessResponse(200)
	@Post('/refresh-token')
	public async refreshToken(@Body() body: { token: string; }) {
		const res = await this.authService.refreshToken(body)
		if (typeof res === 'string') return ControllerUtils.handleResponse(res, this)
		return res
	}
}
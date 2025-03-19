import { Route, Tags, Controller, Body, Post, SuccessResponse, Middlewares, Path, Request, Get, Query } from 'tsoa'
import { AuthService } from '@service'
import { injectable } from 'tsyringe'
import { AuthInput } from 'src/types/auth'
import { ControllerUtils } from '@utils'
import { userSignUpSchema } from '@schemas'
import { schemaValidation } from '@middlewares'
import { RequestHandler } from 'express'
import { TsoaRequest } from 'src/types/tsoa'

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

	/**
	 * Callback to the app to get the social login
	 *
	 */
	@SuccessResponse(200)
	@Get('/callback/{provider}')
	public async callbackSocialLoginGet(@Path() provider: 'google' | 'linkedin' | 'github', @Request() req: TsoaRequest, @Query() code?: string) {
		return req.res?.redirect(`com.gamix://auth/loading?provider=${provider}&code=${code}`)
	}

	/**
	 * Signin or Signup the user in the system with a social login
	 *
	 */
	@SuccessResponse(200)
	@Post('/social-login/{provider}')
	public async socialLogin(@Path() provider: 'google' | 'linkedin' | 'github', @Body() body: { code: string; codeVerifier?: string; }) {
		const res = await this.authService.socialLogin({ provider, code: body.code, codeVerifier: body.codeVerifier })
		if (typeof res === 'string') return ControllerUtils.handleResponse(res, this)
		return res
	}
}
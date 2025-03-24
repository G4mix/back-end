import { Route, Tags, Controller, Body, Post, SuccessResponse, Middlewares, Path, Request, Get, Query, Security } from 'tsoa'
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
		const res = await this.authService.signup({ ...body, email: body.email.toLowerCase() })
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
		const res = await this.authService.signin({ ...body, email: body.email.toLowerCase() })
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
	public async callbackSocialLoginGet(@Path() provider: 'google' | 'linkedin' | 'github', @Request() req: TsoaRequest, @Query() code?: string, @Query() state?: string) {
		console.log(state)
		const token = await this.authService.handleCallbackUrl({ provider, code, codeVerifier: state })
		const res = req.res
		if (!token) return res?.redirect(`com.gamix://auth/loading?provider=${provider}&error=LOGIN_WITH_${provider.toUpperCase()}_FAILED`)
		return res?.redirect(`com.gamix://auth/loading?provider=${provider}&token=${token}`)
	}

	/**
	 * Signin or Signup the user in the system with a social login
	 *
	 */
	@SuccessResponse(200)
	@Post('/social-login/{provider}')
	public async socialLogin(@Path() provider: 'google' | 'linkedin' | 'github', @Body() body: { token: string; }) {
		const res = await this.authService.socialLogin({ provider, token: body.token })
		if (typeof res === 'string') return ControllerUtils.handleResponse(res, this)
		return res
	}

	/**
	 * Link another oauth provider to your account
	 *
	 */
	@SuccessResponse(200)
	@Post('/link-new-oauth-provider/{provider}')
	@Security('jwt', [])
	public async linkNewOAuthProvider(@Path() provider: 'google' | 'linkedin' | 'github', @Body() body: { token: string; }, @Request() req: TsoaRequest) {
		const res = await this.authService.linkNewOAuthProvider({ userId: req.user.sub, provider, token: body.token })
		if (typeof res === 'string') return ControllerUtils.handleResponse(res, this)
		return res
	}
}
import { Route, Tags, Controller, Body, Post, SuccessResponse, Path, Get, Query, Request } from 'tsoa'
import { inject } from 'tsyringe'
import { injectable } from 'tsyringe'
import { SigninOutput } from '@shared/types/tsoa'
import { UserRepository } from '@shared/repositories/user.repository'
import { AuthGateway } from '@shared/gateways/auth.gateway'
import { JwtManager } from '@shared/utils/jwt-manager'
import { BCryptEncoder } from '@shared/utils/bcrypt-encoder'
import { generateRandomPassword } from '@shared/utils/generate-random-password'
import { EXPIRATION_TIME_REFRESH_TOKEN } from '@shared/constants/jwt'
import { UserWithProfile, UserDTO } from '@shared/dto/simple.dto'
import { TsoaRequest } from '@shared/types/tsoa'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'
import { socialLoginRequests } from '@shared/utils/social-login-requests'
import { CommonErrors, ErrorResponse } from '@shared/utils/error-response'

@injectable()
@Route('/v1/auth')
@Tags('Authentication')
export class SocialLoginController extends Controller {
	constructor(
		private userRepository: UserRepository,
		private authGateway: AuthGateway,
		@inject('Logger') private logger: Logger
	) {
		super()
		void this.logger
	}

	/**
	 * Authenticate user with social provider token
	 * 
	 * This endpoint authenticates users using tokens obtained from social providers
	 * (Google, LinkedIn, GitHub). It validates the social token, retrieves user profile
	 * information, and either signs in existing users or creates new accounts.
	 * 
	 * Social Authentication Process:
	 * - Validates social provider token via AuthGateway
	 * - Retrieves user profile from social provider
	 * - Checks if user already exists by email
	 * - Creates new account or links to existing account
	 * - Generates application authentication tokens
	 * - Updates refresh token in database
	 * 
	 * @param provider - Social provider name (google, linkedin, github)
	 * @param body - Object containing the social provider token
	 * @returns Promise resolving to SigninOutput with tokens and user data, or error string
	 * 
	 * @example
	 * ```typescript
	 * // Request body
	 * {
	 *   "token": "social_provider_access_token"
	 * }
	 * 
	 * // Success response (200)
	 * {
	 *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
	 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
	 *   "user": {
	 *     "id": "uuid",
	 *     "username": "john_doe",
	 *     "email": "user@example.com",
	 *     "verified": true,
	 *     "userProfile": { ... }
	 *   }
	 * }
	 * 
	 * // Error responses
	 * "INVALID_PROVIDER" // Unsupported provider
	 * "INVALID_TOKEN" // Social token validation failed
	 * "USER_CREATION_FAILED" // Account creation failed
	 * ```
	 */
	@SuccessResponse(200)
	@Post('/social-login/{provider}')
	@LogResponseTime()
	public async socialLogin(
		@Path() provider: 'google' | 'linkedin' | 'github',
		@Body() body: { token: string }
	): Promise<SigninOutput | ErrorResponse> {
		const { token } = body

		const validation = await this.authGateway.validateSocialLogin({ provider, token })
		if (!validation.valid || !validation.userData) {
			this.setStatus(CommonErrors.USER_NOT_FOUND.code)
			return CommonErrors.USER_NOT_FOUND
		}

		const userData = validation.userData
		let oauthUser = await this.userRepository.findOAuthUser({ provider, email: userData.email })
		if (!oauthUser) {
			let user = await this.userRepository.findByEmail({ email: userData.email })
			if (user) {
				this.setStatus(CommonErrors.PROVIDER_NOT_LINKED.code)
				return CommonErrors.PROVIDER_NOT_LINKED
			}

			user = await this.userRepository.create({
				username: userData.name,
				email: userData.email,
				password: BCryptEncoder.encode(generateRandomPassword())
			})

			oauthUser = await this.userRepository.linkOAuthProvider({
				userId: user.id,
				provider,
				email: userData.email
			})
		}

		const data: SigninOutput = {
			accessToken: JwtManager.generateToken({
				sub: oauthUser.user.id,
				userProfileId: oauthUser.user.userProfileId
			}),
			refreshToken: JwtManager.generateToken({
				sub: oauthUser.user.id,
				userProfileId: oauthUser.user.userProfileId,
				expiresIn: EXPIRATION_TIME_REFRESH_TOKEN
			}),
			user: new UserDTO(oauthUser.user as unknown as UserWithProfile).toJSON()
		}

		await this.userRepository.update({ id: oauthUser.user.id, token: data.refreshToken })

		return data
	}

	/**
	 * Handle OAuth callback from social providers
	 * 
	 * This endpoint processes the OAuth callback from social login providers (Google,
	 * LinkedIn, GitHub) after the user has authenticated with the external service.
	 * It exchanges the authorization code for access tokens and completes the login process.
	 * 
	 * OAuth Callback Process:
	 * - Receives authorization code from provider
	 * - Exchanges code for access tokens via AuthGateway
	 * - Retrieves user profile information
	 * - Creates or updates user account
	 * - Generates application authentication tokens
	 * 
	 * @param provider - Social provider name (google, linkedin, github)
	 * @param req - Express request object
	 * @param code - Authorization code from OAuth provider
	 * @param state - State parameter for OAuth security
	 * @returns Promise resolving to authentication result or error
	 * 
	 * @example
	 * ```typescript
	 * // URL: /v1/auth/callback/google?code=abc123&state=xyz789
	 * 
	 * // Success response (200)
	 * {
	 *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
	 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
	 *   "user": { ... }
	 * }
	 * 
	 * // Error responses
	 * "INVALID_PROVIDER" // Unsupported provider
	 * "OAUTH_ERROR" // OAuth exchange failed
	 * "USER_CREATION_FAILED" // Account creation failed
	 * ```
	 */
	@SuccessResponse(200)
	@Get('/callback/{provider}')
	@LogResponseTime()
	public async callbackSocialLoginGet(
			@Path() provider: 'google' | 'linkedin' | 'github',
			@Request() req: TsoaRequest,
			@Query() code?: string,
			@Query() state?: string
	) {
		const token = await this.handleCallbackUrl({ provider, code, codeVerifier: state })
		const res = req.res!
		if (!token) return res.redirect(`com.gamix://auth/loading?provider=${provider}&error=LOGIN_WITH_${provider.toUpperCase()}_FAILED`)
		return res.redirect(`com.gamix://auth/loading?provider=${provider}&token=${token}`)
	}

	private async handleCallbackUrl({ provider, code, codeVerifier }: { provider: 'google' | 'github' | 'linkedin'; code?: string; codeVerifier?: string; }) {
		const { google, github, linkedin } = socialLoginRequests
		if (!code) return null

		const providers = {
			google: async () => codeVerifier ? google.getToken({ code, codeVerifier }) : null,
			linkedin: async () => linkedin.getToken({ code }),
			github: async () => github.getToken({ code })
		}

		const executeSocialLogin = providers[provider]
		if (!executeSocialLogin) return null

		try {
			return await executeSocialLogin()
		} catch (err) {
			return null
		}
	}
}

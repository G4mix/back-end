import { Route, Tags, Controller, Body, Path, Post, Request, Security, SuccessResponse } from 'tsoa'
import { injectable, inject } from 'tsyringe'
import { AuthGateway } from '@shared/gateways/auth.gateway'
import { UserRepository } from '@shared/repositories/user.repository'
import { CommonErrors, ErrorResponse } from '@shared/utils/error-response'
import { TsoaRequest } from '@shared/types/tsoa'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'
import { Logger } from '@shared/utils/logger'

@injectable()
@Route('/v1/user')
@Tags('User Management')
export class LinkOAuthProviderController extends Controller {
	constructor(
		@inject('AuthGateway') private authGateway: AuthGateway,
		@inject('UserRepository') private userRepository: UserRepository,
		@inject('Logger') private logger: Logger
	) {
		super()
		void this.logger
	}

	/**
	 * Link additional OAuth provider to existing account
	 * 
	 * This endpoint allows authenticated users to link additional social providers
	 * (Google, LinkedIn, GitHub) to their existing account. This enables users to
	 * sign in with multiple social accounts using the same application account.
	 * 
	 * Provider Linking Process:
	 * - Validates user authentication via JWT token
	 * - Validates social provider token via AuthGateway
	 * - Retrieves user profile from social provider
	 * - Checks if provider is already linked to another account
	 * - Links provider to current user account
	 * 
	 * @param provider - Social provider name (google, linkedin, github)
	 * @param body - Object containing the social provider token
	 * @param req - Express request object with JWT token
	 * @returns Promise resolving to success confirmation or error string
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
	 *   "success": true
	 * }
	 * 
	 * // Error responses
	 * "INVALID_PROVIDER" // Unsupported provider
	 * "INVALID_TOKEN" // Social token validation failed
	 * "PROVIDER_ALREADY_LINKED" // Provider linked to another account
	 * "UNAUTHORIZED" // Invalid or missing JWT token
	 * ```
	 */
	@SuccessResponse(200)
	@Post('link-new-oauth-provider/{provider}')
	@Security('jwt', [])
	@LogResponseTime()
	public async linkNewOAuthProvider(
		@Path() provider: 'google' | 'linkedin' | 'github',
		@Body() body: { token: string },
		@Request() req: TsoaRequest
	): Promise<{ success: boolean } | ErrorResponse> {
		const { token } = body
		const userId = req.user.sub
		const validation = await this.authGateway.validateSocialLogin({ provider, token })
		if (!validation.valid || !validation.userData) {
			this.setStatus(CommonErrors.USER_NOT_FOUND.code)
			return CommonErrors.USER_NOT_FOUND
		}
		
		const userData = validation.userData
		
		const user = await this.userRepository.findById({ id: userId })
		if (!user) {
			this.setStatus(CommonErrors.USER_NOT_FOUND.code)
			return CommonErrors.USER_NOT_FOUND
		}

		const existingLink = await this.userRepository.findOAuthUser({ provider, email: userData.email })
		if (existingLink) {
			this.setStatus(CommonErrors.PROVIDER_ALREADY_LINKED.code)
			return CommonErrors.PROVIDER_ALREADY_LINKED
		}

		await this.userRepository.linkOAuthProvider({ userId, provider, email: userData.email })

		return { success: true }
	}
}

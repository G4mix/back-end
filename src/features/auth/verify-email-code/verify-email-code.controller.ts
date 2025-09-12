import { Route, Tags, Controller, Body, Post, SuccessResponse } from 'tsoa'
import { inject } from 'tsyringe'
import { injectable } from 'tsyringe'
import { UserRepository } from '@shared/repositories/user.repository'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'

@injectable()
@Route('/v1/auth')
@Tags('Authentication')
export class VerifyEmailCodeController extends Controller {
	constructor(
		private userRepository: UserRepository,
		@inject('Logger') private logger: Logger
	) {
		super()
		void this.logger
	}

	/**
	 * Verify recovery code and generate temporary access token
	 * 
	 * This endpoint verifies the recovery code sent to the user's email and generates
	 * a temporary access token that allows the user to change their password. The
	 * code must be used within 10 minutes of generation.
	 * 
	 * Verification Process:
	 * - Validates user exists by email
	 * - Checks code expiration (10 minutes)
	 * - Verifies provided code matches stored code
	 * - Generates temporary access token for password change
	 * - Clears recovery code from user account
	 * 
	 * @param body - Object containing email and verification code
	 * @returns Promise resolving to temporary access token or error string
	 * 
	 * @example
	 * ```typescript
	 * // Request body
	 * {
	 *   "email": "user@example.com",
	 *   "code": "ABC123"
	 * }
	 * 
	 * // Success response (200)
	 * {
	 *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
	 * }
	 * 
	 * // Error responses
	 * "USER_NOT_FOUND" // Email not registered
	 * "CODE_EXPIRED" // Code older than 10 minutes
	 * "INVALID_CODE" // Code doesn't match
	 * ```
	 */
	@SuccessResponse(200)
	@Post('/verify-email-code')
	@LogResponseTime()
	public async verifyEmailCode(@Body() body: { code: string; email: string }): Promise<{ accessToken: string } | string> {
		const { code, email } = body
		const normalizedCode = code.toUpperCase()
		const normalizedEmail = email.toLowerCase()

		const user = await this.userRepository.findByEmail({ email: normalizedEmail })
		if (!user || !user.userCode) return 'USER_NOT_FOUND'

		const isCodeExpired = () => {
			if (!user.userCode) return false
			const TEN_MINUTES = 10 * 60 * 1000
			const updatedDate = new Date(user.userCode.updated_at).getTime()
			const now = Date.now()
			return now - updatedDate >= TEN_MINUTES
		}

		if (isCodeExpired()) return 'CODE_EXPIRED'
		if (user.userCode.code !== normalizedCode) return 'CODE_NOT_EQUALS'

		const { JwtManager } = await import('@shared/utils/jwt-manager')
		return { 
			accessToken: JwtManager.generateToken({
				sub: user.id,
				userProfileId: user.userProfileId,
				validRoutes: [{ route: '/auth/change-password', method: 'POST' }]
			})
		}
	}
}

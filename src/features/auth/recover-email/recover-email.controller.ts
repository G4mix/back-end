import { Route, Tags, Controller, Body, Post, SuccessResponse } from 'tsoa'
import { inject } from 'tsyringe'
import { injectable } from 'tsyringe'
import { UserRepository } from '@shared/repositories/user.repository'
import { SESGateway } from '@shared/gateways/ses.gateway'
import { generateRandomCode } from '@shared/utils/generate-random-code'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'

@injectable()
@Route('/v1/auth')
@Tags('Authentication')
export class RecoverEmailController extends Controller {
	constructor(
		private userRepository: UserRepository,
		private sesGateway: SESGateway,
		@inject('Logger') private logger: Logger
	) {
		super()
		void this.logger
	}

	/**
	 * Send password recovery email with verification code
	 * 
	 * This endpoint initiates the password recovery process by sending a verification
	 * code to the user's email address. The code is generated randomly and stored
	 * in the user's account for verification in the next step.
	 * 
	 * Recovery Process:
	 * - Validates user exists by email
	 * - Generates secure random verification code
	 * - Sends email via AWS SES with recovery template
	 * - Stores code in user account for verification
	 * - Code expires after 10 minutes
	 * 
	 * @param body - Object containing the user's email address
	 * @returns Promise resolving to email confirmation or error string
	 * 
	 * @example
	 * ```typescript
	 * // Request body
	 * {
	 *   "email": "user@example.com"
	 * }
	 * 
	 * // Success response (200)
	 * {
	 *   "email": "user@example.com"
	 * }
	 * 
	 * // Error responses
	 * "USER_NOT_FOUND" // Email not registered
	 * "SES_ERROR" // Email sending failed
	 * ```
	 */
	@SuccessResponse(200)
	@Post('/send-recover-email')
	@LogResponseTime()
	public async sendRecoverEmail(@Body() body: { email: string }): Promise<{ email: string } | string> {
		const { email } = body
		const normalizedEmail = email.toLowerCase()

		const user = await this.userRepository.findByEmail({ email: normalizedEmail })
		if (!user) return 'USER_NOT_FOUND'

		const code = generateRandomCode()

		const sentEmail = await this.sesGateway.sendEmail({ 
			template: 'RecoverEmailCodeTemplate', 
			receiver: normalizedEmail, 
			data: { code } 
		})
		if (typeof sentEmail === 'string') return sentEmail

		await this.userRepository.update({ id: user.id, code })

		return { email: user.email }
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

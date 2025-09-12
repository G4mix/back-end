import { Route, Tags, Controller, Body, Post, SuccessResponse } from 'tsoa'
import { inject } from 'tsyringe'
import { injectable } from 'tsyringe'
import { UserRepository } from '@shared/repositories/user.repository'
import { SESGateway } from '@shared/gateways/ses.gateway'
import { generateRandomCode } from '@shared/utils/generate-random-code'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'
import { ErrorResponse, CommonErrors } from '@shared/utils/error-response'

@injectable()
@Route('/v1/auth')
@Tags('Authentication')
export class SendRecoverEmailController extends Controller {
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
	public async sendRecoverEmail(@Body() body: { email: string }): Promise<{ email: string } | ErrorResponse> {
		const { email } = body
		const normalizedEmail = email.toLowerCase()

		const user = await this.userRepository.findByEmail({ email: normalizedEmail })
		if (!user) {
			this.setStatus(CommonErrors.USER_NOT_FOUND.code)
			return CommonErrors.USER_NOT_FOUND
		}

		if (user.verified) {
			this.setStatus(CommonErrors.INTERNAL_ERROR.code)
			return CommonErrors.INTERNAL_ERROR
		}

		const code = generateRandomCode()

		const sentEmail = await this.sesGateway.sendEmail({ 
			template: 'RecoverEmailCodeTemplate', 
			receiver: normalizedEmail, 
			data: { code } 
		})
		if ('message' in sentEmail) {
			this.setStatus(CommonErrors.ERROR_WHILE_SENDING_EMAIL.code)
			return CommonErrors.ERROR_WHILE_SENDING_EMAIL
		}

		await this.userRepository.update({ id: user.id, code })

		return { email: user.email }
	}

}

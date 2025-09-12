import { Route, Tags, Controller, Body, Post, SuccessResponse } from 'tsoa'
import { injectable, inject } from 'tsyringe'
import { SigninInput, SigninOutput } from '@shared/types/tsoa'
import { UserRepository } from '@shared/repositories/user.repository'
import { SESGateway } from '@shared/gateways/ses.gateway'
import { BCryptEncoder } from '@shared/utils/bcrypt-encoder'
import { JwtManager } from '@shared/utils/jwt-manager'
import { EXPIRATION_TIME_REFRESH_TOKEN } from '@shared/constants/jwt'
import { UserDTO } from '@shared/dto/simple.dto'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'
import { Logger } from '@shared/utils/logger'
import { ErrorResponse, CommonErrors } from '@shared/utils/error-response'

@injectable()
@Route('/v1/auth')
@Tags('Authentication')
export class SigninController extends Controller {
	constructor(
		private userRepository: UserRepository,
		private sesGateway: SESGateway,
		@inject('Logger') private logger: Logger
	) {
		super()
	}

	/**
	 * Authenticate user and generate access tokens
	 * 
	 * This endpoint authenticates a user by validating their email and password credentials.
	 * It performs comprehensive security checks including email verification status,
	 * login attempt limits, and password validation. Upon successful authentication,
	 * it generates both access and refresh tokens for the user session.
	 * 
	 * Security Features:
	 * - Email verification status check
	 * - Login attempt rate limiting (max 5 attempts)
	 * - Account temporary blocking after failed attempts
	 * - Password validation with bcrypt
	 * - Automatic email verification status update
	 * 
	 * @param body - Authentication credentials containing email and password
	 * @returns Promise resolving to SigninOutput with tokens and user data, or error string
	 * 
	 * @example
	 * ```typescript
	 * // Request body
	 * {
	 *   "email": "user@example.com",
	 *   "password": "SecurePassword123!"
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
	 * "USER_NOT_FOUND" // User doesn't exist
	 * "EMAIL_NOT_VERIFIED" // Email not verified
	 * "ACCOUNT_BLOCKED" // Too many failed attempts
	 * "INVALID_PASSWORD" // Wrong password
	 * ```
	 */
	@SuccessResponse(200, 'User signed in successfully')
	@Post('/signin')
	@LogResponseTime()
	public async signin(@Body() body: SigninInput): Promise<SigninOutput | ErrorResponse> {
		const { email, password } = body
		const normalizedEmail = email.toLowerCase()
		
		this.logger.info('User attempting signin', { email: normalizedEmail })

		let user = await this.userRepository.findByEmail({ email: normalizedEmail })
		if (!user) {
			this.logger.warn('Signin failed - user not found', { email: normalizedEmail })
			this.setStatus(CommonErrors.USER_NOT_FOUND.code)
			return CommonErrors.USER_NOT_FOUND
		}

		if (!user.verified) {
			this.logger.info('Checking email verification status', { userId: user.id, email: normalizedEmail })
			const emailStatus = await this.sesGateway.checkEmailStatus(normalizedEmail)
			if (typeof emailStatus === 'object' && 'status' in emailStatus && emailStatus.status === 'Success') {
				user = await this.userRepository.update({ id: user.id, verified: true })
				await this.sesGateway.sendEmail({ template: 'SignUp', receiver: user.email })
				this.logger.info('Email verified and welcome email sent', { userId: user.id })
			}
		}

		const now = new Date()
		let attempts = user.loginAttempts
		const moreThanFiveAttempts = user.loginAttempts >= 5
		const blockedByTime = (user.blockedUntil != null && user.blockedUntil.getTime() > now.getTime())

		if (moreThanFiveAttempts) {
			if (blockedByTime) {
				this.logger.warn('Signin blocked - too many attempts', { userId: user.id, attempts })
				this.setStatus(CommonErrors.EXCESSIVE_LOGIN_ATTEMPTS.code)
				return CommonErrors.EXCESSIVE_LOGIN_ATTEMPTS
			}
			attempts = 0
			await this.userRepository.update({ id: user.id, loginAttempts: attempts })
			this.logger.info('Login attempts reset', { userId: user.id })
		}

		if (!BCryptEncoder.compare(password, user.password)) {
			attempts++
			await this.userRepository.update({
				loginAttempts: attempts,
				email: normalizedEmail,
				id: user.id,
				blockedUntil: attempts === 5 ? new Date(now.getTime() + 30 * 60 * 1000) : null
			})
			
			this.logger.warn('Signin failed - wrong password', { userId: user.id, attempts })
			
			if (attempts === 5) {
				this.logger.warn('User blocked due to too many failed attempts', { userId: user.id })
			}
			
			const possibleErrors = [
				'WRONG_PASSWORD_ONCE',
				'WRONG_PASSWORD_TWICE',
				'WRONG_PASSWORD_THREE_TIMES',
				'WRONG_PASSWORD_FOUR_TIMES',
				'WRONG_PASSWORD_FIVE_TIMES',
			]
			this.setStatus(CommonErrors.UNAUTHORIZED.code)
			return CommonErrors[possibleErrors[attempts - 1]]
		}

		const data: SigninOutput = {
			accessToken: JwtManager.generateToken({
				sub: user.id,
				userProfileId: user.userProfileId
			}),
			refreshToken: JwtManager.generateToken({
				sub: user.id,
				userProfileId: user.userProfileId,
				expiresIn: EXPIRATION_TIME_REFRESH_TOKEN
			}),
			user: new UserDTO(user).toJSON()
		}

		user = await this.userRepository.update({ id: user.id, loginAttempts: 0, token: data.refreshToken })
		
		this.logger.info('User signed in successfully', { userId: user.id, email: normalizedEmail })

		return data
	}
}
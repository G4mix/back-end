import { Route, Tags, Controller, Body, Post, SuccessResponse } from 'tsoa'
import { inject } from 'tsyringe'
import { injectable } from 'tsyringe'
import { CreateUserInput, SigninOutput } from '@shared/types/tsoa'
import { UserRepository } from '@shared/repositories/user.repository'
import { SESGateway } from '@shared/gateways/ses.gateway'
import { BCryptEncoder } from '@shared/utils/bcrypt-encoder'
import { JwtManager } from '@shared/utils/jwt-manager'
import { EXPIRATION_TIME_REFRESH_TOKEN } from '@shared/constants/jwt'
import { UserWithProfile, UserDTO } from '@shared/dto/simple.dto'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'

@injectable()
@Route('/v1/auth')
@Tags('Authentication')
export class SignupController extends Controller {
	constructor(
		private userRepository: UserRepository,
		private sesGateway: SESGateway,
		@inject('Logger') private logger: Logger
	) {
		super()
		void this.logger
	}

	/**
	 * Register a new user account
	 * 
	 * This endpoint creates a new user account in the system. It performs comprehensive
	 * validation including email uniqueness check, email identity verification through AWS SES,
	 * and secure password hashing. Upon successful registration, the user is automatically
	 * signed in with generated access and refresh tokens.
	 * 
	 * Registration Process:
	 * - Validates email uniqueness
	 * - Verifies email identity through AWS SES
	 * - Hashes password with bcrypt
	 * - Creates user profile with default settings
	 * - Generates authentication tokens
	 * - Updates refresh token in database
	 * 
	 * @param body - User registration data containing email, password, and username
	 * @returns Promise resolving to SigninOutput with tokens and user data, or error string
	 * 
	 * @example
	 * ```typescript
	 * // Request body
	 * {
	 *   "email": "newuser@example.com",
	 *   "password": "SecurePassword123!",
	 *   "username": "newuser123"
	 * }
	 * 
	 * // Success response (201)
	 * {
	 *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
	 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
	 *   "user": {
	 *     "id": "uuid",
	 *     "username": "newuser123",
	 *     "email": "newuser@example.com",
	 *     "verified": true,
	 *     "userProfile": { ... }
	 *   }
	 * }
	 * 
	 * // Error responses
	 * "USER_ALREADY_EXISTS" // Email already registered
	 * "INVALID_EMAIL_IDENTITY" // Email verification failed
	 * "EMAIL_NOT_VERIFIED" // SES verification failed
	 * ```
	 */
	@SuccessResponse(201)
	@Post('/signup')
	@LogResponseTime()
	public async signup(@Body() body: CreateUserInput): Promise<SigninOutput | string> {
		const { email, password, username } = body
		const normalizedEmail = email.toLowerCase()

		const existingUser = await this.userRepository.findByEmail({ email: normalizedEmail })
		if (existingUser) return 'USER_ALREADY_EXISTS'

		const emailVerification = await this.sesGateway.verifyIdentity({ receiver: normalizedEmail })
		if (typeof emailVerification === 'string') return emailVerification

		const createdUser = await this.userRepository.create({
			password: BCryptEncoder.encode(password),
			username,
			email: normalizedEmail
		})

		const data: SigninOutput = {
			accessToken: JwtManager.generateToken({
				sub: createdUser.id,
				userProfileId: createdUser.userProfileId
			}),
			refreshToken: JwtManager.generateToken({
				sub: createdUser.id,
				userProfileId: createdUser.userProfileId,
				expiresIn: EXPIRATION_TIME_REFRESH_TOKEN
			}),
			user: new UserDTO(createdUser as unknown as UserWithProfile).toJSON()
		}

		await this.userRepository.update({ id: createdUser.id, token: data.refreshToken })

		return data
	}
}

import { Route, Tags, Controller, Body, Post, SuccessResponse, Security, Request } from 'tsoa'
import { inject } from 'tsyringe'
import { injectable } from 'tsyringe'
import { SigninOutput } from '@shared/types/tsoa'
import { UserRepository } from '@shared/repositories/user.repository'
import { BCryptEncoder } from '@shared/utils/bcrypt-encoder'
import { JwtManager } from '@shared/utils/jwt-manager'
import { EXPIRATION_TIME_REFRESH_TOKEN } from '@shared/constants/jwt'
import { UserDTO } from '@shared/dto/simple.dto'
import { TsoaRequest } from '@shared/types/tsoa'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'
import { ErrorResponse } from '@shared/utils/error-response'

@injectable()
@Route('/v1/auth')
@Tags('Authentication')
export class ChangePasswordController extends Controller {
	constructor(
		private userRepository: UserRepository,
		@inject('Logger') private logger: Logger
	) {
		super()
		void this.logger
	}

	/**
	 * Change user password and generate new authentication tokens
	 * 
	 * This endpoint allows authenticated users to change their current password.
	 * Upon successful password change, new access and refresh tokens are automatically
	 * generated and the refresh token is updated in the database.
	 * 
	 * @param body - Object containing the new password
	 * @param req - Express request object with JWT token containing user information
	 * @returns Promise resolving to SigninOutput with new tokens and user data, or error string
	 * 
	 * @example
	 * ```typescript
	 * // Request body
	 * {
	 *   "newPassword": "NewSecurePassword123!"
	 * }
	 * 
	 * // Success response
	 * {
	 *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
	 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
	 *   "user": {
	 *     "id": "uuid",
	 *     "username": "john_doe",
	 *     "email": "john@example.com",
	 *     "verified": true,
	 *     "userProfile": { ... }
	 *   }
	 * }
	 * ```
	 */
	@SuccessResponse(200)
	@Post('/change-password')
	@Security('jwt', [])
	@LogResponseTime()
	public async changePassword(
		@Body() body: { newPassword: string }, 
		@Request() req: TsoaRequest
	): Promise<SigninOutput | ErrorResponse> {
		const { newPassword } = body
		const userId = req.user.sub

		const user = (await this.userRepository.findById({ id: userId }))!

		await this.userRepository.update({ 
			id: userId, 
			password: BCryptEncoder.encode(newPassword) 
		})

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

		await this.userRepository.update({ id: user.id, token: data.refreshToken })

		return data
	}
}
import { Route, Tags, Controller, Body, Post, SuccessResponse, Middlewares, Security, Request } from 'tsoa'
import { inject } from 'tsyringe'
import { injectable } from 'tsyringe'
import { SigninOutput } from '@shared/types/tsoa'
import { UserRepository } from '@shared/repositories/user.repository'
import { schemaValidation } from '@shared/middlewares/schema-validation'
import { userChangePasswordSchema } from '@shared/schemas/user.schema'
import { RequestHandler } from 'express'
import { BCryptEncoder, JwtManager } from '@shared/utils'
import { EXPIRATION_TIME_REFRESH_TOKEN } from '@shared/constants'
import { UserDTO } from '@shared/dto/simple.dto'
import { TsoaRequest } from '@shared/types/tsoa'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators'

@injectable()
@Route('api/v1/auth')
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
	 *   "password": "NewSecurePassword123!"
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
	@Middlewares<RequestHandler>(schemaValidation(userChangePasswordSchema))
	@LogResponseTime()
	public async changePassword(
		@Body() body: { password: string }, 
		@Request() req: TsoaRequest
	): Promise<SigninOutput | string> {
		const { password } = body
		const userId = req.user.sub

		const user = await this.userRepository.findById({ id: userId })
		if (!user) return 'USER_NOT_FOUND'

		await this.userRepository.update({ 
			id: userId, 
			password: BCryptEncoder.encode(password) 
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

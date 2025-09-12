import { Route, Tags, Controller, Body, Post, SuccessResponse } from 'tsoa'
import { inject } from 'tsyringe'
import { injectable } from 'tsyringe'
import { UserRepository } from '@shared/repositories/user.repository'
import { JwtManager } from '@shared/utils/jwt-manager'
import { EXPIRATION_TIME_REFRESH_TOKEN } from '@shared/constants/jwt'
import { Logger } from '@shared/utils/logger'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'

@injectable()
@Route('/v1/auth')
@Tags('Authentication')
export class RefreshTokenController extends Controller {
	constructor(
		private userRepository: UserRepository,
		@inject('Logger') private logger: Logger
	) {
		super()
		void this.logger
	}

	/**
	 * Refresh authentication tokens using refresh token
	 * 
	 * This endpoint allows users to obtain new access and refresh tokens using their
	 * current refresh token. It validates the refresh token, verifies the user exists,
	 * and generates a new token pair. This is essential for maintaining user sessions
	 * without requiring re-authentication.
	 * 
	 * Token Refresh Process:
	 * - Validates refresh token signature and expiration
	 * - Extracts user ID from token payload
	 * - Verifies user exists and is active
	 * - Generates new access and refresh tokens
	 * - Updates refresh token in database
	 * 
	 * @param body - Object containing the refresh token
	 * @returns Promise resolving to new token pair or error string
	 * 
	 * @example
	 * ```typescript
	 * // Request body
	 * {
	 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
	 * }
	 * 
	 * // Success response (200)
	 * {
	 *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
	 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
	 * }
	 * 
	 * // Error responses
	 * "INVALID_TOKEN" // Token is malformed or expired
	 * "USER_NOT_FOUND" // User doesn't exist
	 * ```
	 */
	@SuccessResponse(200)
	@Post('/refresh-token')
	@LogResponseTime()
	public async refreshToken(@Body() body: { refreshToken: string }): Promise<{ accessToken: string; refreshToken: string } | string> {
		const { refreshToken: token } = body

		let userId: string
		try {
			userId = JwtManager.decode(token).sub
		} catch (err) {
			this.setStatus(401)
			return 'UNAUTHORIZED'
		}

		const user = await this.userRepository.findById({ id: userId })
		if (!user) {
			this.setStatus(404)
			return 'USER_NOT_FOUND'
		}

		if (!user.verified) {
			this.setStatus(403)
			return 'USER_NOT_VERIFIED'
		}

		const data = {
			accessToken: JwtManager.generateToken({
				sub: user.id,
				userProfileId: user.userProfileId
			}),
			refreshToken: JwtManager.generateToken({
				sub: user.id,
				userProfileId: user.userProfileId,
				expiresIn: EXPIRATION_TIME_REFRESH_TOKEN
			})
		}

		await this.userRepository.update({ id: user.id, token: data.refreshToken })

		return data
	}
}

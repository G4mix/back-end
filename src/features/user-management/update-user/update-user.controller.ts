import { Route, Tags, Controller, Body, SuccessResponse, Security, Request, Patch } from 'tsoa'
import { injectable, inject } from 'tsyringe'
import { UpdateUserInput, UpdateUserOutput } from '@shared/types/tsoa'
import { UserRepository } from '@shared/repositories/user.repository'
import { UserGateway } from '@shared/gateways/user.gateway'
import { BCryptEncoder } from '@shared/utils/bcrypt-encoder'
import { MAX_SIZE, SUPPORTED_IMAGES } from '@shared/constants/images'
import { UserDTO } from '@shared/dto/simple.dto'
import { TsoaRequest } from '@shared/types/tsoa'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'
import { Logger } from '@shared/utils/logger'

@injectable()
@Route('api/v1/users')
@Tags('User Management')
export class UpdateUserController extends Controller {
	constructor(
		private userRepository: UserRepository,
		private userGateway: UserGateway,
		@inject('Logger') private logger: Logger
	) {
		super()
	}

	/**
	 * Update authenticated user's profile information
	 * 
	 * This endpoint allows authenticated users to update their profile information
	 * including basic details and profile images. It supports partial updates,
	 * file uploads for profile images, and comprehensive validation.
	 * 
	 * Update Features:
	 * - Update basic profile information (displayName, autobiography)
	 * - Upload and manage profile icon (with size and type validation)
	 * - Upload and manage background image
	 * - Automatic file cleanup for replaced images
	 * - Secure file storage via S3Gateway
	 * - Comprehensive input validation
	 * 
	 * @param body - User update data including profile fields and optional files
	 * @param req - Express request object with JWT token containing user information
	 * @returns Promise resolving to updated user data or error string
	 * 
	 * @example
	 * ```typescript
	 * // Request body (multipart/form-data)
	 * {
	 *   "displayName": "John Doe",
	 *   "autobiography": "Software developer passionate about technology",
	 *   "icon": File, // Optional profile image file
	 *   "backgroundImage": File // Optional background image file
	 * }
	 * 
	 * // Success response (200)
	 * {
	 *   "id": "uuid",
	 *   "username": "john_doe",
	 *   "email": "user@example.com",
	 *   "verified": true,
	 *   "userProfile": {
	 *     "id": "uuid",
	 *     "icon": "https://s3.amazonaws.com/bucket/icon.jpg",
	 *     "displayName": "John Doe",
	 *     "autobiography": "Software developer passionate about technology",
	 *     "backgroundImage": "https://s3.amazonaws.com/bucket/bg.jpg",
	 *     "links": [...]
	 *   }
	 * }
	 * 
	 * // Error responses
	 * "USER_NOT_FOUND" // User doesn't exist
	 * "FILE_TOO_LARGE" // Uploaded file exceeds size limit
	 * "UNSUPPORTED_FILE_TYPE" // Invalid file type
	 * "UPLOAD_ERROR" // File upload failed
	 * "UNAUTHORIZED" // Invalid or missing JWT token
	 * ```
	 */
	@SuccessResponse(200, 'User updated successfully')
	@Patch()
	@Security('jwt', [])
	@LogResponseTime()
	public async updateUser(
		@Body() body: UpdateUserInput,
		@Request() req: TsoaRequest
	): Promise<UpdateUserOutput | string> {
		const userId = req.user.sub
		this.logger.info('Updating user profile', { userId, fields: Object.keys(body) })

		const currentUser = await this.userRepository.findById({ id: userId })
		if (!currentUser) {
			this.logger.warn('User not found for update', { userId })
			return 'USER_NOT_FOUND'
		}

		const updateData: any = {}

		if (body.username) updateData.username = body.username
		if (body.email) updateData.email = body.email.toLowerCase()
		if (body.password) updateData.password = BCryptEncoder.encode(body.password)
		if (body.displayName !== undefined) updateData.displayName = body.displayName
		if (body.autobiography !== undefined) updateData.autobiography = body.autobiography
		if (body.links !== undefined) updateData.links = body.links

		if (body.icon && typeof body.icon === 'object') {
			if (body.icon.size > MAX_SIZE) {
				this.logger.warn('Icon file too large', { userId, size: body.icon.size })
				throw new Error('FILE_TOO_LARGE')
			}
			if (!Object.keys(SUPPORTED_IMAGES).includes(body.icon.mimetype)) {
				this.logger.warn('Unsupported icon file type', { userId, mimetype: body.icon.mimetype })
				throw new Error('UNSUPPORTED_FILE_TYPE')
			}
			
			const uploadResult = await this.userGateway.uploadUserIcon({ file: body.icon })
			if (typeof uploadResult === 'string') {
				this.logger.error('Icon upload failed', { userId, error: uploadResult })
				throw new Error(uploadResult)
			}
			updateData.icon = uploadResult
			this.logger.info('Icon uploaded successfully', { userId })
		}

		if (body.backgroundImage && typeof body.backgroundImage === 'object') {
			if (body.backgroundImage.size > MAX_SIZE) {
				this.logger.warn('Background image too large', { userId, size: body.backgroundImage.size })
				throw new Error('FILE_TOO_LARGE')
			}
			if (!Object.keys(SUPPORTED_IMAGES).includes(body.backgroundImage.mimetype)) {
				this.logger.warn('Unsupported background image type', { userId, mimetype: body.backgroundImage.mimetype })
				throw new Error('UNSUPPORTED_FILE_TYPE')
			}
			
			const uploadResult = await this.userGateway.uploadUserBackground({ file: body.backgroundImage })
			if (typeof uploadResult === 'string') {
				this.logger.error('Background image upload failed', { userId, error: uploadResult })
				throw new Error(uploadResult)
			}
			updateData.backgroundImage = uploadResult
			this.logger.info('Background image uploaded successfully', { userId })
		}

		const updatedUser = await this.userRepository.update({ id: userId, ...updateData })
		this.logger.info('User profile updated successfully', { userId })

		return {
			user: new UserDTO(updatedUser).toJSON()
		}
	}
}
import { Route, Tags, Controller, SuccessResponse, Security, Request, Patch, UploadedFile, FormField } from 'tsoa'
import { injectable, inject } from 'tsyringe'
import { UpdateUserOutput } from '@shared/types/tsoa'
import { UserRepository } from '@shared/repositories/user.repository'
import { UserGateway } from '@shared/gateways/user.gateway'
import { BCryptEncoder } from '@shared/utils/bcrypt-encoder'
import { MAX_SIZE, SUPPORTED_IMAGES } from '@shared/constants/images'
import { UserDTO } from '@shared/dto/simple.dto'
import { TsoaRequest } from '@shared/types/tsoa'
import { LogResponseTime } from '@shared/decorators/log-response-time.decorator'
import { Logger } from '@shared/utils/logger'
import { ErrorResponse, CommonErrors } from '@shared/utils/error-response'
import { UpdateUserInputSchema } from './update-user.dto'
import { FormValidationUtil } from '@shared/utils/form-validation.util'

@injectable()
@Route('/v1/user')
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
		@Request() req: TsoaRequest,
		@FormField() username?: string,
		@FormField() email?: string,
		@FormField() password?: string,
		@FormField() displayName?: string,
		@FormField() autobiography?: string,
		@FormField() links?: string,
		@UploadedFile('icon') icon?: Express.Multer.File,
		@UploadedFile('backgroundImage') backgroundImage?: Express.Multer.File
	): Promise<UpdateUserOutput | ErrorResponse> {
		const userId = req.user.sub
		const fields = [username, email, password, displayName, autobiography, links, icon, backgroundImage].filter(Boolean)
		this.logger.info('Updating user profile', { userId, fields: fields.map(f => typeof f === 'string' ? f : 'file') })

		const currentUser = await this.userRepository.findById({ id: userId })
		if (!currentUser) {
			this.logger.warn('User not found for update', { userId })
			return CommonErrors.USER_NOT_FOUND
		}

		const updateData: any = {}

		// Validação manual para campos @FormField usando o schema do DTO
		const validationResult = FormValidationUtil.validateFields(
			{ username, email, password, displayName, autobiography, links }, 
			UpdateUserInputSchema
		)
		if (!validationResult.success) {
			this.logger.warn('Validation failed for form fields', { userId, error: validationResult.error })
			this.setStatus(validationResult.error!.code)
			return validationResult.error!
		}

		if (username) updateData.username = username
		if (email) updateData.email = email.toLowerCase()
		if (password) updateData.password = BCryptEncoder.encode(password)
		if (displayName !== undefined) updateData.displayName = displayName
		if (autobiography !== undefined) updateData.autobiography = autobiography
		if (links !== undefined) {
			try {
				updateData.links = JSON.parse(links)
			} catch {
				updateData.links = links.split(',').map(link => link.trim())
			}
		}

		if (icon) {
			if (icon.size > MAX_SIZE) {
				this.logger.warn('Icon file too large', { userId, size: icon.size })
				this.setStatus(400)
				return CommonErrors.EXCEEDED_MAX_SIZE
			}
			if (!Object.keys(SUPPORTED_IMAGES).includes(icon.mimetype)) {
				this.logger.warn('Unsupported icon file type', { userId, mimetype: icon.mimetype })
				this.setStatus(400)
				return CommonErrors.INVALID_IMAGE_FORMAT
			}
			
			const uploadResult = await this.userGateway.uploadUserIcon({ file: icon })
			if (typeof uploadResult === 'string') {
				this.logger.error('Icon upload failed', { userId, error: uploadResult })
				this.setStatus(500)
				return CommonErrors.PICTURE_UPDATE_FAIL
			}
			updateData.icon = uploadResult
			this.logger.info('Icon uploaded successfully', { userId })
		}

		if (backgroundImage) {
			if (backgroundImage.size > MAX_SIZE) {
				this.logger.warn('Background image too large', { userId, size: backgroundImage.size })
				this.setStatus(400)
				return CommonErrors.EXCEEDED_MAX_SIZE
			}
			if (!Object.keys(SUPPORTED_IMAGES).includes(backgroundImage.mimetype)) {
				this.logger.warn('Unsupported background image type', { userId, mimetype: backgroundImage.mimetype })
				this.setStatus(400)
				return CommonErrors.INVALID_IMAGE_FORMAT
			}
			
			const uploadResult = await this.userGateway.uploadUserBackground({ file: backgroundImage })
			if (typeof uploadResult === 'string') {
				this.logger.error('Background image upload failed', { userId, error: uploadResult })
				this.setStatus(500)
				return CommonErrors.PICTURE_UPDATE_FAIL
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
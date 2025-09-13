import { Logger } from '@shared/utils/logger'
import { DTORegistry } from '@shared/utils/dto-registry'

/**
 * Inicializador automático de DTOs
 * 
 * Este arquivo centraliza o registro de todos os DTOs do sistema,
 * facilitando a manutenção e evitando duplicação de código.
 */
export class DTOInitializer {
	private logger: Logger
	private registry: DTORegistry

	constructor(logger: Logger) {
		this.logger = logger
		this.registry = DTORegistry.getInstance(logger)
	}

	/**
	 * Inicializa todos os DTOs do sistema
	 */
	async initializeAllDTOs(): Promise<void> {
		try {
			// Inicializa DTOs que seguem o padrão Zod
			await this.initializeAuthDTOs()
			await this.initializeIdeasDTOs()
			await this.initializeCommentsDTOs()
			await this.initializeLikesDTOs()
			await this.initializeViewsDTOs()
			await this.initializeFollowDTOs()
			await this.initializeUserManagementDTOs()

			this.logger.info('DTOs inicializados com sucesso', {
				totalRoutes: this.registry.listRoutes().length,
				routes: this.registry.listRoutes()
			})
		} catch (error) {
			this.logger.error('Erro ao inicializar DTOs', { error })
			throw error
		}
	}

	/**
	 * Inicializa DTOs de autenticação
	 */
	private async initializeAuthDTOs(): Promise<void> {
		try {
			// Change Password
			const { ChangePasswordDTO } = await import('../../features/auth/change-password/change-password.dto')
			this.registry.registerDTO('POST /v1/auth/change-password', ChangePasswordDTO)

			// Signup
			const { SignupDTO } = await import('../../features/auth/signup/signup.dto')
			this.registry.registerDTO('POST /v1/auth/signup', SignupDTO)

			// Signin
			const { SigninDTO } = await import('../../features/auth/signin/signin.dto')
			this.registry.registerDTO('POST /v1/auth/signin', SigninDTO)

			// Refresh Token
			const { RefreshTokenDTO } = await import('../../features/auth/refresh-token/refresh-token.dto')
			this.registry.registerDTO('POST /v1/auth/refresh-token', RefreshTokenDTO)

			// Send Recover Email
			const { SendRecoverEmailDTO } = await import('../../features/auth/send-recover-email/send-recover-email.dto')
			this.registry.registerDTO('POST /v1/auth/send-recover-email', SendRecoverEmailDTO)
			this.registry.registerDTO('POST /v1/auth/recover-email/send', SendRecoverEmailDTO)

			// Verify Email Code
			const { VerifyEmailCodeDTO } = await import('../../features/auth/verify-email-code/verify-email-code.dto')
			this.registry.registerDTO('POST /v1/auth/verify-email-code', VerifyEmailCodeDTO)
			this.registry.registerDTO('POST /v1/auth/recover-email/verify', VerifyEmailCodeDTO)

			// Social Login
			const { SocialLoginDTO } = await import('../../features/auth/social-login/social-login.dto')
			this.registry.registerDTO('POST /v1/auth/social-login/google', SocialLoginDTO)
			this.registry.registerDTO('POST /v1/auth/social-login/linkedin', SocialLoginDTO)
			this.registry.registerDTO('POST /v1/auth/social-login/github', SocialLoginDTO)

			this.logger.debug('DTOs de autenticação inicializados')
		} catch (error) {
			this.logger.warn('Erro ao inicializar DTOs de autenticação', { error })
		}
	}

	/**
	 * Inicializa DTOs de ideias
	 */
	private async initializeIdeasDTOs(): Promise<void> {
		try {
			// Create Idea
			const { CreateIdeaDTO } = await import('../../features/ideas/create-idea/create-idea.dto')
			this.registry.registerDTO('POST /v1/idea', CreateIdeaDTO)

			// Update Idea
			const { UpdateIdeaDTO } = await import('../../features/ideas/update-idea/update-idea.dto')
			this.registry.registerDTO('PATCH /v1/idea/:id', UpdateIdeaDTO)

			// Get Ideas
			const { GetIdeasDTO } = await import('../../features/ideas/get-ideas/get-ideas.dto')
			this.registry.registerDTO('GET /v1/idea', GetIdeasDTO)

			this.logger.debug('DTOs de ideias inicializados')
		} catch (error) {
			this.logger.warn('Erro ao inicializar DTOs de ideias', { error })
		}
	}

	/**
	 * Inicializa DTOs de comentários
	 */
	private async initializeCommentsDTOs(): Promise<void> {
		try {
			// Create Comment
			const { CreateCommentDTO } = await import('../../features/comments/create-comment/create-comment.dto')
			this.registry.registerDTO('POST /v1/comment/', CreateCommentDTO)

			// Get Comments
			const { GetCommentsDTO } = await import('../../features/comments/get-comments/get-comments.dto')
			this.registry.registerDTO('GET /v1/comments', GetCommentsDTO)

			this.logger.debug('DTOs de comentários inicializados')
		} catch (error) {
			this.logger.warn('Erro ao inicializar DTOs de comentários', { error })
		}
	}

	/**
	 * Inicializa DTOs de likes
	 */
	private async initializeLikesDTOs(): Promise<void> {
		try {
			// Toggle Like
			const { ToggleLikeDTO } = await import('../../features/likes/toggle-like/toggle-like.dto')
			this.registry.registerDTO('POST /v1/likes/toggle', ToggleLikeDTO)

			this.logger.debug('DTOs de likes inicializados')
		} catch (error) {
			this.logger.warn('Erro ao inicializar DTOs de likes', { error })
		}
	}

	/**
	 * Inicializa DTOs de views
	 */
	private async initializeViewsDTOs(): Promise<void> {
		try {
			// Record View
			const { RecordViewDTO } = await import('../../features/views/record-view/record-view.dto')
			this.registry.registerDTO('POST /v1/views/record', RecordViewDTO)
			this.registry.registerDTO('POST /v1/views', RecordViewDTO)

			this.logger.debug('DTOs de views inicializados')
		} catch (error) {
			this.logger.warn('Erro ao inicializar DTOs de views', { error })
		}
	}

	/**
	 * Inicializa DTOs de follow
	 */
	private async initializeFollowDTOs(): Promise<void> {
		try {
			// Toggle Follow
			const { ToggleFollowDTO } = await import('../../features/follow/toggle-follow/toggle-follow.dto')
			this.registry.registerDTO('POST /v1/follow/toggle', ToggleFollowDTO)

			// Get Followers
			const { GetFollowersDTO } = await import('../../features/follow/get-followers/get-followers.dto')
			this.registry.registerDTO('GET /v1/follow/followers/:userId', GetFollowersDTO)

			// Get Following
			const { GetFollowingDTO } = await import('../../features/follow/get-following/get-following.dto')
			this.registry.registerDTO('GET /v1/follow/following/:userId', GetFollowingDTO)

			this.logger.debug('DTOs de follow inicializados')
		} catch (error) {
			this.logger.warn('Erro ao inicializar DTOs de follow', { error })
		}
	}

	/**
	 * Inicializa DTOs de gerenciamento de usuários
	 */
	private async initializeUserManagementDTOs(): Promise<void> {
		try {
			// Get Ideas by ID
			const { GetIdeaByIdDTO } = await import('../../features/ideas/get-idea-by-id/get-idea-by-id.dto')
			this.registry.registerDTO('GET /v1/idea/:id', GetIdeaByIdDTO)

			// Delete Idea
			const { DeleteIdeaDTO } = await import('../../features/ideas/delete-idea/delete-idea.dto')
			this.registry.registerDTO('DELETE /v1/idea/:id', DeleteIdeaDTO)

			// Update User
			const { UpdateUserDTO } = await import('../../features/user/update-user/update-user.dto')
			this.registry.registerDTO('PATCH /v1/user', UpdateUserDTO)

			// Get Users
			const { GetUsersDTO } = await import('../../features/user/get-users/get-users.dto')
			this.registry.registerDTO('GET /v1/user', GetUsersDTO)

			// Get User by ID
			const { GetUserByIdDTO } = await import('../../features/user/get-user-by-id/get-user-by-id.dto')
			this.registry.registerDTO('GET /v1/user/:id', GetUserByIdDTO)

			// Delete User
			const { DeleteUserDTO } = await import('../../features/user/delete-user/delete-user.dto')
			this.registry.registerDTO('DELETE /v1/user/:id', DeleteUserDTO)

			// Link OAuth Provider
			const { LinkOAuthProviderDTO } = await import('../../features/user/link-oauth-provider/link-oauth-provider.dto')
			this.registry.registerDTO('POST /v1/user/link-new-oauth-provider/:provider', LinkOAuthProviderDTO)

			this.logger.debug('DTOs de gerenciamento de usuários inicializados')
		} catch (error) {
			this.logger.warn('Erro ao inicializar DTOs de gerenciamento de usuários', { error })
		}
	}

}

/**
 * Função helper para inicializar todos os DTOs
 */
export async function initializeAllDTOs(logger: Logger): Promise<void> {
	const initializer = new DTOInitializer(logger)
	await initializer.initializeAllDTOs()
}

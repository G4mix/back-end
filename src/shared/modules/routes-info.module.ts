import { injectable, singleton, inject } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { RouteLister, RouteInfo } from '@shared/utils/route-lister'
import { StartupModule } from './startup.module'

@injectable()
@singleton()
export class RoutesInfoModule implements StartupModule {
	public readonly name = 'Routes Info Module'

	constructor(@inject('Logger') private logger: Logger) {}

	public async initialize(): Promise<void> {
		this.logger.info('Displaying registered routes...')
		
		const routes: RouteInfo[] = [
			// User Management Routes
			{ method: 'POST', path: '/v1/users', controller: 'CreateUserController', action: 'createUser', tags: ['User Management'] },
			{ method: 'GET', path: '/v1/users', controller: 'GetUsersController', action: 'getUsers', tags: ['User Management'] },
			{ method: 'GET', path: '/v1/users/{userId}', controller: 'GetUserByIdController', action: 'getUserById', tags: ['User Management'] },
			{ method: 'PUT', path: '/v1/users/{userId}', controller: 'UpdateUserController', action: 'updateUser', tags: ['User Management'], security: ['jwt'] },
			{ method: 'DELETE', path: '/v1/users/{userId}', controller: 'DeleteUserController', action: 'deleteUser', tags: ['User Management'], security: ['jwt'] },

			// Authentication Routes
			{ method: 'POST', path: '/v1/auth/signin', controller: 'SigninController', action: 'signin', tags: ['Authentication'] },
			{ method: 'POST', path: '/v1/auth/signup', controller: 'SignupController', action: 'signup', tags: ['Authentication'] },
			{ method: 'POST', path: '/v1/auth/change-password', controller: 'ChangePasswordController', action: 'changePassword', tags: ['Authentication'], security: ['jwt'] },
			{ method: 'POST', path: '/v1/auth/refresh-token', controller: 'RefreshTokenController', action: 'refreshToken', tags: ['Authentication'] },
			{ method: 'POST', path: '/v1/auth/social-login', controller: 'SocialLoginController', action: 'socialLogin', tags: ['Authentication'] },
			{ method: 'POST', path: '/v1/auth/recover-email', controller: 'RecoverEmailController', action: 'recoverEmail', tags: ['Authentication'] },
		]

		const routeLister = new RouteLister(this.logger)
		routeLister.listRoutes(routes)
		
		this.logger.info('Routes information displayed successfully')
	}
}

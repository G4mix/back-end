import { container } from '@ioc'
import { socialLoginRequestsMock, UserRepositoryMock } from '@mocks'
import { UserRepository } from '@repository'
import { AuthService } from '@service'
import { fetchAPI, setup } from '@setup'
import { DependencyContainer, Lifecycle } from 'tsyringe'

const { authHeaders } = setup
let testContainer: DependencyContainer

beforeEach(() => {
	jest.resetModules()

    testContainer = container.createChildContainer()
    testContainer.register<UserRepository>(UserRepository, { useClass: UserRepositoryMock}, { lifecycle: Lifecycle.Singleton })
    setup['userRepositoryMock'] = container.resolve(UserRepository) as UserRepositoryMock
	setup['socialLoginRequests'] = socialLoginRequestsMock
})

afterEach(() => {
	jest.clearAllMocks()
})

describe('> [app] socialLoginTests POST', () => {
	socialLogin()
})

function socialLogin() {
	it('login with any provider > 200', async () => {
		setup.userRepositoryMock.users = []
		setup.userRepositoryMock.userOAuths = []

		// console.log('RESOLVENDO REPOSITORY: ', container.resolve(UserRepository).constructor.name)
		const response = await fetchAPI('/auth/social-login/google', 'POST', authHeaders, {
			token: 'valid_google_token'
		} as any)

		expect(response.status).toBe(200)
		const responseData = await response.json() as {
			accessToken: string;
			refreshToken: string;
			user: any;
		}
		

		// 6. Verificar se os tokens foram gerados
		console.log('responseData: ', responseData)
		expect(responseData.accessToken).toBeDefined()
		expect(responseData.refreshToken).toBeDefined()
		expect(responseData.user).toBeDefined()

		// 7 .Verificar se o usuário foi criado no banco
        console.log('setup.userRepositoryMock.users: ', setup.userRepositoryMock.users)
		expect(setup.userRepositoryMock.users).toHaveLength(1)
		const createdUser = setup.userRepositoryMock.users[0]
		expect(createdUser.email).toBe('mock-email')
		expect(createdUser.username).toBe('mock-username')
		expect(createdUser.verified).toBe(true)

		// 8. Verificar se o OAuth provider foi vinculado
		console.log('setup.userRepositoryMock.userOAuths: ', setup.userRepositoryMock.userOAuths)
		expect(setup.userRepositoryMock.userOAuths).toHaveLength(1)
		const oauthLink = setup.userRepositoryMock.userOAuths[0]
		expect(oauthLink.provider).toBe('google')
		expect(oauthLink.email).toBe('mock-email')
		expect(oauthLink.userId).toBe(createdUser.id)

		// 9. Verificar se o mock foi chamado
		console.log(setup.socialLoginRequests.google.getUserData)
		expect(setup.socialLoginRequests.google.getUserData).toHaveBeenCalledWith({
			provider: 'google',
			token: 'valid_google_token'
		})

		expect(createdUser.refreshTokenId).toBeDefined()
	})

	it('execute socialLogin and provider returns null user data > USER_NOT_FOUND 404', async () => {
		const authService = container.resolve(AuthService)
		const mockSocialLogin = jest.spyOn(authService, 'socialLogin').mockImplementation(async () => {
			return 'USER_NOT_FOUND'
		})

		const response = await fetchAPI('/auth/social-login/google', 'POST', authHeaders, {
			token: 'valid_but_empty_token'
		} as any)

		expect(response.status).toBe(404) // USER_NOT_FOUND mapeia para 404
		const responseData = await response.json() as { message: string }
		expect(responseData.message).toBe('USER_NOT_FOUND')

		// Verificar que o mock foi chamado
		expect(mockSocialLogin).toHaveBeenCalledWith({
			provider: 'google',
			token: 'valid_but_empty_token'
		})

		// Verificar que nenhum acesso ao banco ocorreu
		expect(setup.pg.users).toHaveLength(0)
		expect(setup.pg.userOAuths).toHaveLength(0)
		mockSocialLogin.mockRestore()
	})

	it('execute socialLogin and provider API fails (network error) > INTERNAL_SERVER_ERROR 500', async () => {
		const authService = container.resolve(AuthService)
		const mockSocialLogin = jest.spyOn(authService, 'socialLogin').mockImplementation(async () => {
			throw new Error('OAuth API Error')
		})

		const response = await fetchAPI('/auth/social-login/google', 'POST', authHeaders, {
			token: 'invalid_oauth_token'
		} as any)

		expect(response.status).toBe(500)
		// console.log('response: ', response)
		const responseData = await response.json() as { message: string }
		expect(responseData.message).toBe('INTERNAL_SERVER_ERROR')

		expect(mockSocialLogin).toHaveBeenCalledWith({
			provider: 'google',
			token: 'invalid_oauth_token'
		})

		// Verificar que nenhum acesso ao banco ocorreu
		expect(setup.pg.users).toHaveLength(0)
		expect(setup.pg.userOAuths).toHaveLength(0)
		mockSocialLogin.mockRestore()
	})

	// it('should return PROVIDER_NOT_LINKED when user exists but OAuth is not linked > PROVIDER_NOT_LINKED')
}
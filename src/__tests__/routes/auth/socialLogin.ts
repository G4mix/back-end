import { container } from '@ioc'
import { socialLoginRequestsMock, UserRepositoryMock } from '@mocks'
import { UserRepository } from '@repository'
import { fetchAPI, setup } from '@setup'
import { DependencyContainer, Lifecycle } from 'tsyringe'
const { socialLoginRequests } = require('@utils')

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

        // mock forçado do socialLoginRequests, uma vez que para acoplá-lo ao setup de testes, seria necessária uma refatoração no código de produção
        const mockSocialLogin = await jest.spyOn(socialLoginRequests.google, 'getUserData').mockResolvedValue({
            email: 'mock-email',
            username: 'mock-username'
        })
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
		expect(responseData.accessToken).toBeDefined()
		expect(responseData.refreshToken).toBeDefined()
		expect(responseData.user).toBeDefined()

		// 7 .Verificar se o usuário foi criado no banco
		expect(setup.userRepositoryMock.users).toHaveLength(1)
		const createdUser = setup.userRepositoryMock.users[0]
		expect(createdUser.email).toBe('mock-email')
		expect(createdUser.username).toBe('mock-username')
		expect(createdUser.verified).toBe(true)

		// 8. Verificar se o OAuth provider foi vinculado
		expect(setup.userRepositoryMock.userOAuths).toHaveLength(1)
		const oauthLink = setup.userRepositoryMock.userOAuths[0]
		expect(oauthLink.provider).toBe('google')
		expect(oauthLink.email).toBe('mock-email')
		expect(oauthLink.userId).toBe(createdUser.id)

		// 9. Verificar se o mock foi chamado
		expect(mockSocialLogin).toHaveBeenCalledWith({
			token: 'valid_google_token'
		})

		expect(createdUser.refreshTokenId).toBeDefined()
	})

	it('execute socialLogin and provider returns null user data > USER_NOT_FOUND 404', async () => {
        setup.userRepositoryMock.users = []
		setup.userRepositoryMock.userOAuths = []

        // mock forçado do socialLoginRequests, uma vez que para acoplá-lo ao setup de testes, seria necessária uma refatoração no código de produção
        const mockSocialLogin = jest.spyOn(socialLoginRequests.google, 'getUserData').mockResolvedValue(null)
		const response = await fetchAPI('/auth/social-login/google', 'POST', authHeaders, {
			token: 'valid_token'
		} as any)

		expect(response.status).toBe(404) // USER_NOT_FOUND mapeia para 404
		const responseData = await response.json() as { message: string }
		expect(responseData.message).toBe('USER_NOT_FOUND')

		// Verificar que o mock foi chamado
		expect(mockSocialLogin).toHaveBeenCalledWith({
			token: 'valid_token'
		})

		// Verificar que nenhum acesso ao banco ocorreu
		expect(setup.userRepositoryMock.users).toHaveLength(0)
		expect(setup.userRepositoryMock.userOAuths).toHaveLength(0)
		mockSocialLogin.mockRestore()
	})

	it('execute socialLogin and provider API fails (network error) > INTERNAL_SERVER_ERROR 500', async () => {
		setup.userRepositoryMock.users = []
		setup.userRepositoryMock.userOAuths = []

        // mock forçado do socialLoginRequests, uma vez que para acoplá-lo ao setup de testes, seria necessária uma refatoração no código de produção
        const mockSocialLogin = await jest.spyOn(socialLoginRequests.google, 'getUserData').mockRejectedValue(new Error('OAuth API Error'))
		console.log(mockSocialLogin.mock.results)

		const response = await fetchAPI('/auth/social-login/google', 'POST', authHeaders, {
			token: 'invalid_oauth_token'
		} as any)
        console.log(response)

		expect(response.status).toBe(500)
		const responseData = await response.json() as { message: string }
		expect(responseData.message).toBe('INTERNAL_SERVER_ERROR')

		expect(mockSocialLogin).toHaveBeenCalledWith({
			token: 'invalid_oauth_token'
		})

		// Verificar que nenhum acesso ao banco ocorreu
		expect(setup.userRepositoryMock.users).toHaveLength(0)
		expect(setup.userRepositoryMock.userOAuths).toHaveLength(0)
		mockSocialLogin.mockRestore()
	})

    it('should return 422 when token is missing > 422', async () => {
        const response = await fetchAPI('/auth/social-login/google', 'POST', authHeaders, {} as any)

        expect(response.status).toBe(422)
        const responseData = await response.json() as { message: string}
        expect(responseData.message).toBe('INVALID_TOKEN')
    })

    it('should return 409 when user exists but OAuth is not linked > PROVIDER_NOT_LINKED', async () => {
        // buscar usuário que não tem OAuth vinculado
        setup.userRepositoryMock.findOAuthUser({ provider: 'google', email: 'mock-email' })
        // console.log(setup.userRepositoryMock.findOAuthUser({ provider: 'google', email: 'mock-email' }))
       
        // criar um usuário
        setup.userRepositoryMock.create({
            email: 'mock-email',
            username: 'mock-username',
            password: 'mock-password'
        })

        jest.spyOn(socialLoginRequests.google, 'getUserData').mockResolvedValue({
            name: 'mock-username',
            email: 'mock-email'
          });

       setup.userRepositoryMock.findByEmail({ email: 'mock-email'})
    //    console.log(setup.userRepositoryMock.findByEmail({ email: 'mock-email' }))

       const response = await fetchAPI('/auth/social-login/google', 'POST', authHeaders, {
        token: 'valid_google_token'
      } as any)
    
      expect(response.status).toBe(409)
      const responseData = await response.json() as { message: string}
      expect(responseData.message).toBe('PROVIDER_NOT_LINKED')
    })

	// it('should return PROVIDER_NOT_LINKED when user exists but OAuth is not linked > PROVIDER_NOT_LINKED')
}
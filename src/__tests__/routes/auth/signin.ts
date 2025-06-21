jest.mock('src/utils/socialLoginRequests', () => ({
	socialLoginRequests: {
		google: {
			getUserData: jest.fn().mockResolvedValue({ name: 'John Doe', email: 'john.doe@gmail.com' }),
			revokeToken: jest.fn().mockResolvedValue(true)
		},
		github: {
			getUserData: jest.fn(),
			getUserPrimaryEmail: jest.fn(),
			revokeToken: jest.fn()
		},
		linkedin: {
			getUser: jest.fn(),
			revokeToken: jest.fn()
		}
	}
}))

import { fetchAPI, getTestUser, handleMessage, setup } from '@setup'
import { ApiMessage } from '@constants'
import { container } from '@ioc'
import { AuthService } from '@service'

// // Extend the Setup type to include userService for testing
// type SetupWithUserService = typeof setup & { userService?: any }

const { authHeaders, testUser: { email, password } } = setup

// Mock manual do AuthService para garantir que use o socialLoginRequests mockado ao invés do real
beforeEach(() => {
	jest.resetModules()
	const mockSocialLoginRequests = {
		google: {
			getUserData: jest.fn().mockResolvedValue({ name: 'John Doe', email: 'john.doe@gmail.com' }),
			revokeToken: jest.fn().mockResolvedValue(true)
		},
		github: {
			getUserData: jest.fn(),
			getUserPrimaryEmail: jest.fn(),
			revokeToken: jest.fn()
		},
		linkedin: {
			getUser: jest.fn(),
			revokeToken: jest.fn()
		}
	}

	jest.doMock('@utils', () => ({
		...jest.requireActual('@utils'),
		socialLoginRequests: mockSocialLoginRequests
	}))
})

describe('> [app] POST /auth/signin', () => {
	signinWhenUserNotExists()
	signinWithWrongPassword()
	signinWithSuccess()
	signinSecurityTests()
})

function signinWhenUserNotExists() {
	it('signinWhenUserNotExists > USER_NOT_FOUND', async () => {
		const response = await fetchAPI('/auth/signin', 'POST', authHeaders, { email: 'aba', password })
		await handleMessage({ response, message: 'USER_NOT_FOUND' })
	})

	it('signinWhenEmailFormatIsInvalid > EMAIL_FORMAT_INVALID', async () => {
		const response = await fetchAPI('/auth/signin', 'POST', authHeaders, { email: 'aba@1234', password })
		const responseData = await response.json() as { message: string }
		console.log('Response data:', responseData)

		expect(response.status).toBe(400)
		expect(responseData.message).toBe('EMAIL_FORMAT_INVALID')
	})
}

function signinWithWrongPassword() {
	const possibleErrors: ApiMessage[] = [
		'WRONG_PASSWORD_ONCE',
		'WRONG_PASSWORD_TWICE',
		'WRONG_PASSWORD_THREE_TIMES',
		'WRONG_PASSWORD_FOUR_TIMES',
		'WRONG_PASSWORD_FIVE_TIMES'
	]
	possibleErrors.map((message, i) => {
		it(`signinWithWrongPassword > ${message}`, async () => {
			await getTestUser({ loginAttempts: i })
			const response = await fetchSigninWithWrongPassword()
			await handleMessage({ response, message })
		})
	})
	it('signinWithWrongPassword > EXCESSIVE_LOGIN_ATTEMPTS', async () => {
		const now = new Date()
		await getTestUser({ loginAttempts: 5, blockedUntil: new Date(now.getTime() + 30 * 60 * 1000) })
		const response = await fetchSigninWithWrongPassword()
		await handleMessage({ response, message: 'EXCESSIVE_LOGIN_ATTEMPTS' })
	})
	// it('signinWithWrongPassword > ERROR_WHILE_SENDING_EMAIL', async () => {
	//   setup['sesClientMock'].setThrowError(true).setType('send')
	//   await getTestUser({ loginAttempts: 4 })
	// 	const response = await fetchSigninWithWrongPassword()
	// 	await handleMessage({ response, message: 'ERROR_WHILE_SENDING_EMAIL' })
	// })
}

function signinSecurityTests() {
	describe('> [app] Security Tests POST /auth/signin', () => {
		it('signinAndSqlInjectionInEmail > EMAIL_INVALID', async () => {
			const sqlInjectionAttempts = [
				"' OR '1'='1'",
				"'; DROP TABLE users; --",
				"' OR 1=1; --",
				"admin' --",
				"' UNION SELECT * FROM users; --"
			]

			for (const attempt of sqlInjectionAttempts) {
				const response = await fetchAPI('/auth/signin', 'POST', authHeaders, {
					email: attempt,
					password: password
				})

				expect(response.status).not.toBe(200)
				if (response.headers.get('content-type')?.includes('application/json')) {
					const responseData = await response.json() as { message: string }
					console.log('Response data:', responseData)
				}

			}
		})

		it('signinAndSqlInjectionInPassword', async () => {
			const testUser = await getTestUser()
			const sqlInjectionAttempts = [
				"' OR '1'='1",
				"'; DROP TABLE users; --",
				"' OR 1=1; --"
			]

			for (const attempt of sqlInjectionAttempts) {
				const response = await fetchAPI('/auth/signin', 'POST', authHeaders, {
					email: testUser.email,
					password: attempt
				})

				expect(response.status).not.toBe(200)
				if (response.headers.get('content-type')?.includes('application/json')) {
					const responseData = await response.json() as { message: string }
					console.log('Response data:', responseData)
				}
			}
		})
	})
}

function signinWithSuccess() {
	it('signinWithSuccess > verify email 200', async () => {
		// 1. usuário de teste com email não verificado, simulação de verificação de email
		const testUser = await getTestUser({
			loginAttempts: 5,
			blockedUntil: new Date(new Date().getTime() - 31 * 60 * 1000),
			verified: false,
			userProfile: {
				id: 'test-profile-id',
				displayName: null,
				icon: null,
				created_at: new Date(),
				updated_at: new Date()
			}
		})

		// 2. Configurar mock do SES para simular email verificado
		setup['testUser']['email'] = testUser.email
		setup.sesClientMock.setType('status').setStatus('Success')

		jest.spyOn(setup.pg.user, 'update')
			// @ts-ignore: Mock não retorna Prisma_UserClient
			.mockImplementation(({ where, data }) => {
				// Aplica updates e retorna usuário com "verified" como true
				const updatedUser = {
					...testUser,
					...data,
					updated_at: new Date(),
					userProfile: testUser.userProfile,
					refreshToken: null,
					oauthAccounts: []
				}
				return Promise.resolve(updatedUser as any)
			})

		// 4. login
		const response = await fetchAPI('/auth/signin', 'POST', authHeaders, {
			email: testUser.email,
			password
		})

		const responseData = await response.json() as { user: typeof testUser }
		expect(response.status).toBe(200)
		expect(responseData.user.verified).toBe(true)
		expect(responseData.user.userProfile).toBeDefined()
	})
}
// function signinWithSuccess2() {
// 	it('signinWithSuccess2 > 200', async () => {
// 		const ipAddress = setup.ipAddress
// 		setup.ipAddress = 'aaa'
// 		setup.ipAddress = ipAddress 
// 		await getTestUser()
// 		const response = await fetchAPI('/auth/signin', 'POST', authHeaders, { email, password })
// 		expect(response.status).toBe(200)
// 	})
// }
describe('> [app] socialLoginTests POST', () => {
	socialLogin()
})

function socialLogin() {
	it('login with any provider > 200', async () => {
		// 1. Mock direto do método socialLogin do AuthService
		const authService = container.resolve(AuthService)
		const mockSocialLogin = jest.spyOn(authService, 'socialLogin').mockImplementation(async () => {
			// 2. Simular o fluxo completo de socialLogin
			const googleUserData = { name: 'John Doe', email: 'john.doe@gmail.com' }

			// 3. criar usuário diretamente no mock do banco
			const newUser = await setup.pg.user.create({
				data: {
					username: googleUserData.name,
					email: googleUserData.email,
					password: 'hashed_password',
					verified: true,
					userProfile: { create: {} }
				}
			})

			// 4. conectar usuário com o provider via oauthLink
			await setup.pg.userOAuth.create({
				data: {
					user: { connect: { id: newUser.id } },
					provider: 'google',
					email: googleUserData.email
				}
			})

			// 5. dados de resposta com tipagem correta
			return {
				accessToken: 'mock_access_token',
				refreshToken: 'mock_refresh_token',
				user: {
					id: newUser.id,
					username: googleUserData.name,
					email: googleUserData.email,
					verified: true,
					created_at: new Date().toISOString(),
					userProfile: { id: 'mock-profile-id', icon: null, displayName: null }
				}
			}
		})

		setup.pg.users = []
		setup.pg.userOAuths = []
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
		expect(setup.pg.users).toHaveLength(1)
		const createdUser = setup.pg.users[0]
		expect(createdUser.email).toBe('john.doe@gmail.com')
		expect(createdUser.username).toBe('John Doe')
		expect(createdUser.verified).toBe(true)

		// 8. Verificar se o OAuth provider foi vinculado
		expect(setup.pg.userOAuths).toHaveLength(1)
		const oauthLink = setup.pg.userOAuths[0]
		expect(oauthLink.provider).toBe('google')
		expect(oauthLink.email).toBe('john.doe@gmail.com')
		expect(oauthLink.userId).toBe(createdUser.id)

		// 9. Verificar se o mock foi chamado
		expect(mockSocialLogin).toHaveBeenCalledWith({
			provider: 'google',
			token: 'valid_google_token'
		})

		expect(createdUser.refreshTokenId).toBeDefined()
		mockSocialLogin.mockRestore()
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
		console.log('response: ', response)
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

// function linkNewOAuthProviderWhenProviderNotFound() {
// 	it('signin with provider not supported', async () => {
// 		// 1. criar usuário de teste manualmente

// 		const testUser = await getTestUser()
// 		const oauthTestUser = {
// 			...testUser,
// 			provider: 'google',
// 			email: testUser.email
// 		}

// 		const jwt = await getValidToken()

// 		console.log('oauthTestUser:', oauthTestUser)
// 		setupWithUserService.userService = setupWithUserService.userService || {};
// 		setupWithUserService.userService.linkOAuthProvider = jest.fn(async ({ userId, provider, email }) => {
// 			return {
// 				userId,
// 				provider,
// 				email,
// 			}
// 		})
// 		// 3. definir no mock do OAuth o token de resposta do provider como sendo válido
// 		setup.socialLoginRequests.google.getUserData.mockImplementation(async ({ token }) => {
//   			if (token === 'invalid_token') throw new Error('Invalid token');
//   			return { name: oauthTestUser.username, email: oauthTestUser.email };
// 		});
// 		setup.socialLoginRequests.google.revokeToken.mockResolvedValue(true)

// 		// 2. simular chamada ao endpoint

// 		const response = await fetchAPI('/auth/link-new-oauth-provider/google', 'POST',
// 			{ ... authHeaders, Authorization: `Bearer ${jwt}` },
// 			{ token: 'invalid_token' } as any
// 		)



// 		// 3. expects

// 		console.log('Response: ', response)

// 		expect(response.status).toBe(400)
// 	})
// }



async function fetchSigninWithWrongPassword() {
	return await fetchAPI('/auth/signin', 'POST', authHeaders, { email, password: 'wrong' })
}

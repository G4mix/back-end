import { fetchAPI, getTestUser, handleMessage, setup } from '@setup'
import { ApiMessage } from '@constants'
import { BCryptEncoder } from '@utils'
import { container } from '@ioc'
import { UserRepository } from '@repository'
import { UserRepositoryMock } from '@mocks'

// // Extend the Setup type to include userService for testing
// type SetupWithUserService = typeof setup & { userService?: any }

const { authHeaders, testUser: { email, password } } = setup

beforeEach(() => {
	jest.resetModules()
})

afterEach(() => {
	jest.clearAllMocks()
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
			password: BCryptEncoder.encode(password),
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

		// 3. Configurar mock do userRepository
		const userRepositoryMock = container.resolve(UserRepository) as UserRepositoryMock
		userRepositoryMock.users = [testUser]

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

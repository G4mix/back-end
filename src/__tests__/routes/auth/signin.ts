import { fetchAPI, getTestUser, handleMessage, setup } from '@setup'
import { ApiMessage } from '@constants'

const { authHeaders, testUser: { email, password } } = setup

describe('> [app] POST /auth/signin', () => {
	signinWhenUserNotExists()
	signinWithWrongPassword()
	signinWithSuccess()
})

function signinWhenUserNotExists() {
	it('signinWhenUserNotExists > USER_NOT_FOUND', async () => {
		const response = await fetchAPI('/auth/signin', 'POST', authHeaders, { email: 'aba', password })
		await handleMessage({ response, message: 'USER_NOT_FOUND' })
	})

	it('signinWhenEmailFormatIsInvalid > EMAIL_FORMAT_INVALID', async () => {
		const response = await fetchAPI('/auth/signin', 'POST', authHeaders, { email: 'aba@1234', password})
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
    const now =  new Date()
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

async function fetchSigninWithWrongPassword() {
	return await fetchAPI('/auth/signin', 'POST', authHeaders, { email, password: 'wrong' })
}

import { fetchAPI, getTestUser, handleMessage, setup } from '@setup'
import { ApiMessage } from '@constants'

const { authHeaders, testUser: { email, password } } = setup

describe('> [app] POST /auth/signin', () => {
	signinWhenUserNotExists()
	signinWithWrongPassword()
	signinWithSuccess()
	signinWithSuccess2()
})

function signinWhenUserNotExists() {
	it('signinWhenUserNotExists > USER_NOT_FOUND', async () => {
		const response = await fetchAPI('/auth/signin', 'POST', authHeaders, { email: 'aba', password })
		await handleMessage({ response, message: 'USER_NOT_FOUND' })
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
	it('signinWithSuccess > 200', async () => {
		await getTestUser({ loginAttempts: 5, blockedUntil: new Date(new Date().getTime() - 31 * 60 * 1000) })
    setup.sesClientMock.setType('verify').setType('status')
		const response = await fetchAPI('/auth/signin', 'POST', authHeaders, { email, password })
		expect(response.status).toBe(200)
	})
}
function signinWithSuccess2() {
	it('signinWithSuccess2 > 200', async () => {
		const ipAddress = setup.ipAddress
		setup.ipAddress = 'aaa'
		setup.ipAddress = ipAddress 
		await getTestUser()
		const response = await fetchAPI('/auth/signin', 'POST', authHeaders, { email, password })
		expect(response.status).toBe(200)
	})
}

async function fetchSigninWithWrongPassword() {
	return await fetchAPI('/auth/signin', 'POST', authHeaders, { email, password: 'wrong' })
}

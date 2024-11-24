import { setup, fetchAPI, handleMessage } from '@setup'

const { authHeaders, testUser } = setup

describe('> [app] POST /auth/signup', () => {
	signupWithInvalidName()
	signupWithInvalidEmail()
	signupWithInvalidPassword()
	// signupWhenTheEmailIsNotSended()
	signupSuccess()
	// signupWhenTheUserAlreadyExists()
})

function signupWithInvalidName() {
	it('signupWithInvalidName > INVALID_NAME', async () => {
		const response = await fetchAPI('/auth/signup', 'POST', authHeaders, { ...testUser, username: '1!' })
		await handleMessage({ response, message: 'INVALID_NAME' })
	})
}
function signupWithInvalidEmail() {
	it('signupWithInvalidEmail > INVALID_EMAIL', async () => {
		const response = await fetchAPI('/auth/signup', 'POST', authHeaders, { ...testUser, email: 'test' })
		await handleMessage({ response, message: 'INVALID_EMAIL' })
	})
}
function signupWithInvalidPassword() {
	it('signupWithInvalidPassword > INVALID_PASSWORD', async () => {
		const response = await fetchAPI('/auth/signup', 'POST', authHeaders, { ...testUser, password: 'Pa1!' })
		await handleMessage({ response, message: 'INVALID_PASSWORD' })
	})
}
// function signupWhenTheEmailIsNotSended() {
// 	it('signupWhenTheEmailIsNotSended > ERROR_WHILE_CHECKING_EMAIL', async () => {
// 		setup['sesClientMock'].setThrowError(true)
// 		const response = await fetchAPI('/auth/signup', 'POST', authHeaders, testUser)
// 		await handleMessage({ response, message: 'ERROR_WHILE_CHECKING_EMAIL' })
// 		setup['sesClientMock'].setThrowError(false)
// 	})
// }
function signupSuccess() {
	it('signupSuccess > 201', async () => {
		setup.pg.users = []
		const response = await fetchAPI('/auth/signup', 'POST', authHeaders, testUser)
		expect(response.status).toBe(201)
	})
}
// function signupWhenTheUserAlreadyExists() {
// 	it('signupWhenTheUserAlreadyExists > USER_ALREADY_EXISTS', async () => {
// 		await getTestUser()
// 		const response = await fetchAPI('/auth/signup', 'POST', authHeaders, testUser)
// 		await handleMessage({ response, message: 'USER_ALREADY_EXISTS' })
// 	})
// }

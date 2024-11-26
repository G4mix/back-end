import { fetchAPI, getFormData, getTestUser, getValidToken, handleMessage, setup } from '@setup'

const { updateTestUser: { email, username, password } } = setup

describe('> [app] PATCH /users', () => {
	updateUserWhenAlreadyExists()
	updateUserWithInvalidImageFormat()
	updateUserWhenFaqFileUpdateFail()
	updateUserWithSuccess()
})

function updateUserWhenAlreadyExists() {
	it('updateUserWhenAlreadyExists > USER_ALREADY_EXISTS', async () => {
		await getTestUser({ email, username, password })
		const response = await fetchAPI('/user', 'PATCH', {
			'Authorization': `Bearer ${await getValidToken()}`
		}, getFormData({ email, username, password }))
		handleMessage({ response, message: 'USER_ALREADY_EXISTS' })
	})
}
function updateUserWithInvalidImageFormat() {
	it('updateUserWithInvalidImageFormat > INVALID_IMAGE_FORMAT', async () => {
		const dataToHandle = {
			email, username, password, icon: new Blob([new Uint8Array(1)], { type: 'image/gif' })
		}
		const response = await fetchAPI('/user', 'PATCH', {
			'Authorization': `Bearer ${await getValidToken()}`,
		}, getFormData(dataToHandle))
		handleMessage({ response, message: 'INVALID_IMAGE_FORMAT' })
	})
}
function updateUserWhenFaqFileUpdateFail() {
	it('updateUserWhenFaqFileUpdateFail > 200', async () => {
		setup.s3ClientMock.setThrowError(true)
		const response = await fetchAPI('/user', 'PATCH', {
			'Authorization': `Bearer ${await getValidToken()}`,
		}, getFormData({ email, username, password, icon: setup.updateTestUser.icon }))
		handleMessage({ response, message: 'PICTURE_UPDATE_FAIL' })
	})
}
function updateUserWithSuccess() {
	it('updateUserWithSuccess > 200', async () => {
		const response = await fetchAPI('/user', 'PATCH', {
			'Authorization': `Bearer ${await getValidToken()}`,
		}, getFormData({ email, username, password, icon: setup.updateTestUser.icon }))

		expect(response.status).toBe(200)
	})
}

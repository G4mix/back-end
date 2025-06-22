import { fetchAPI, getFormData, getTestUser, getValidToken, handleMessage, setup } from '@setup'

const { updateTestUser: { email, username, password } } = setup

// Mock do arquivo Multer
const createMockFile = (type: string, size: number = 1): Express.Multer.File => ({
	fieldname: 'icon',
	originalname: 'test.gif',
	encoding: '7bit',
	mimetype: type,
	buffer: Buffer.from(new Uint8Array(size)),
	size,
	destination: '',
	filename: '',
	path: '',
	stream: {} as any
})

describe('> [app] PATCH /user', () => {
	updateUserWhenAlreadyExists()
	updateUserWithInvalidImageFormat()
	updateUserWithExceededMaxSize()
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
		// Criar usuário primeiro
		const user = await getTestUser()
		setup['userRepositoryMock'].users = [user]

		const response = await fetchAPI('/user', 'PATCH', {
			'Authorization': `Bearer ${await getValidToken()}`,
		}, getFormData({ email, username, password, icon: createMockFile('image/webp') }))

		handleMessage({ response, message: 'INVALID_IMAGE_FORMAT' })
	})
}

function updateUserWithExceededMaxSize() {
	it('updateUserWithInvalidImageFormat > EXCEEDED_MAX_SIZE', async () => {
		// Criar usuário primeiro
		const user = await getTestUser()
		setup['userRepositoryMock'].users = [user]

		const response = await fetchAPI('/user', 'PATCH', {
			'Authorization': `Bearer ${await getValidToken()}`,
		}, getFormData({ email, username, password, icon: createMockFile('image/png', 1000009) }))

		const responseData = await response.json() as { message: string }
		expect(response.status).toBe(400)
		expect(responseData.message).toBe('EXCEEDED_MAX_SIZE')
	})
}

function updateUserWhenFaqFileUpdateFail() {
	it('updateUserWhenFaqFileUpdateFail > 200', async () => {
		// Criar usuário primeiro
		const user = await getTestUser()
		setup['userRepositoryMock'].users = [user]

		setup.s3ClientMock.setThrowError(true)
		const response = await fetchAPI('/user', 'PATCH', {
			'Authorization': `Bearer ${await getValidToken()}`,
		}, getFormData({ email, username, password, icon: createMockFile('image/png') }))

		const responseData = await response.json() as { message: string }
		expect(response.status).toBe(400)
		expect(responseData.message).toBe('PICTURE_UPDATE_FAIL')
	})
}

function updateUserWithSuccess() {
	it('updateUserWithSuccess > 200', async () => {
		// Criar usuário primeiro
		const user = await getTestUser()
		setup['userRepositoryMock'].users = [user]

		setup['sesClientMock'].setStatus('Pending').setType('status').setThrowError(false)
		const response = await fetchAPI('/user', 'PATCH', {
			'Authorization': `Bearer ${await getValidToken()}`,
		}, getFormData({ email, username, password, icon: createMockFile('image/png') }))

		expect(response.status).toBe(200)
	})
}

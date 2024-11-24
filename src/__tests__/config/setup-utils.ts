import { messages } from '@constants'
import { Method, Body, URL, HandleMessageProps } from './setup'
import { setup } from './setup-constants'
import { BCryptEncoder } from '@utils'
import { UserWithUserProfile } from '@mocks'

export const originalFetch: typeof global.fetch = global.fetch
export const fetchAPI = async (url: URL, method: Method, headers?: RequestInit['headers'], body?: Body) => {
	if (headers && headers['Content-Type' as keyof typeof headers] === 'application/json') {
		body = JSON.stringify(body)
	}
	return await originalFetch(`http://localhost:8080/api/v1${url}`, {
		method, body: body as RequestInit['body'], headers, credentials: 'include'
	})
}

export const handleMessage = async ({ response, message: expectMessage }: HandleMessageProps) => {
	expect(response.status).toBe(messages[expectMessage])
	const { message } = await response.json() as { message: string }
	expect(message).toBe(expectMessage)
}

export const getTestUser = async (data?: Partial<UserWithUserProfile>): Promise<UserWithUserProfile> => {
	if (data) return await updateUser(data)

	if (setup.pg.users[0]) return setup.pg.users[0]

	const { email, username, password } = setup.testUser
	
	const user = await setup.pg.user.create({
		data: { email, username, password: BCryptEncoder.encode(password) } as any
	})
	return user as any
}
const updateUser = async (data: Partial<UserWithUserProfile>) => {
	setup.pg['users'][0] = { ...await getTestUser(), ...data }
	return setup.pg['users'][0]
}

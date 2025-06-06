import { messages } from '@constants'
import { Method, Body, URL, HandleMessageProps } from './setup'
import { setup } from './setup-constants'
import { BCryptEncoder, JwtManager } from '@utils'
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

export const getFormData = (anyData: { [x: string]: string | Blob | boolean }) => {
	const data = new FormData()
	for (const key of Object.keys(anyData)) data.append(key, anyData[key as keyof typeof anyData] as any)
	return data
}

export const getValidToken = async ({ almostExpiring }: { almostExpiring?: boolean; } = { almostExpiring: false }) => {
	const user = await getTestUser()
	return JwtManager.generateToken({
		sub: user.id, userProfileId: user.userProfileId, verifiedEmail: true, ipAddress: setup['ipAddress'], expiresIn: almostExpiring ? 900 : undefined
	})
}

export const getInvalidToken = async ({ invalidate }: {
	invalidate: 'time' | 'userId' | 'ip'
}) => {
	const user = await getTestUser()

	const invalidationTypes = {
		'time': () => {
			return JwtManager.generateToken({
				sub: user.id, verifiedEmail: true, ipAddress: setup['ipAddress'], expiresIn: -10, userProfileId: user.userProfileId
			})
		},
		'userId': () => {
			return JwtManager.generateToken({
				sub: 'aaa', verifiedEmail: true, ipAddress: setup['ipAddress'], userProfileId: user.userProfileId
			})
		},
		'ip': () => {
			return JwtManager.generateToken({
				sub: user.id, verifiedEmail: true, ipAddress: 'aaa', userProfileId: user.userProfileId
			})
		}
	}
	return invalidationTypes[invalidate]()
}

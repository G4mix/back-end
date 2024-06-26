import { Method, Body, URL } from './setup'

export const originalFetch: typeof global.fetch = global.fetch
export const fetchAPI = async (url: URL, method: Method, headers?: RequestInit['headers'], body?: Body) => {
	if (headers && headers['Content-Type' as keyof typeof headers] === 'application/json') {
		body = JSON.stringify(body)
	}
	return await originalFetch(`http://localhost:8080/api/v1${url}`, {
		method, body: body as RequestInit['body'], headers, credentials: 'include'
	})
}
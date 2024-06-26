import { fetchAPI } from '@setup'

describe('> [app] GET /metrics', () => {
	getHelloWorldWithSuccess()
})


function getHelloWorldWithSuccess() {
	it('getHelloWorldWithSuccess > 200', async () => {
		const response = await fetchAPI('/hello-world', 'GET')
		expect(response.status).toBe(200)
	})
}
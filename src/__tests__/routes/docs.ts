import { fetchAPI } from '@setup'

describe('> [app] GET /docs', () => {
	it('200', async () => {
		expect((await fetchAPI('/docs', 'GET')).status).toBe(200)
	})
})
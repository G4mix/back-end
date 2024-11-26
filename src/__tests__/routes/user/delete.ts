import { setup, fetchAPI, getValidToken } from '@setup'

const { authHeaders } = setup

describe('> [app] DELETE /user', () => {
	deleteUserWithSuccess()
})

function deleteUserWithSuccess() {
	it('deleteUserWithSuccess > 204', async () => {
    const token = await getValidToken({ almostExpiring: true })
		const response = await fetchAPI('/user', 'DELETE', { 'Authorization': `Bearer ${token}`, ...authHeaders })
		expect(response.status).toBe(204)
	})
}


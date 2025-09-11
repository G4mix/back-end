import { createTestApp } from '@test/setup/test-app'
import { App } from '@config/app'
import request from 'supertest'

describe('Signup Tests', () => {
	let app: App
	let server: any

	beforeEach(async () => {
		app = await createTestApp()
		server = app.getInstance()
	})

	afterEach(async () => {
		if (app) {
			app.stop()
		}
	})

	describe('POST /api/v1/auth/signup', () => {
		it('should create user successfully with valid data', async () => {
			const userData = {
				username: 'testuser',
				email: 'test@example.com',
				password: 'TestPassword123!'
			}

			const response = await request(server)
				.post('/api/v1/auth/signup')
				.send(userData)
				.expect(201)
			expect(response.body).toHaveProperty('accessToken')
			expect(response.body).toHaveProperty('refreshToken')
			expect(response.body).toHaveProperty('user')
			expect(response.body.user.email).toBe(userData.email)
			expect(response.body.user.username).toBe(userData.username)
		})

		it('should return validation error for invalid email format', async () => {
			const userData = {
				username: 'testuser',
				email: 'invalid-email',
				password: 'TestPassword123!'
			}

			const response = await request(server)
				.post('/api/v1/auth/signup')
				.send(userData)
				.expect(400)

			expect(response.body.message).toBe('INVALID_EMAIL')
		})

		it('should return validation error for weak password', async () => {
			const userData = {
				username: 'testuser',
				email: 'test@example.com',
				password: '123'
			}

			const response = await request(server)
				.post('/api/v1/auth/signup')
				.send(userData)
				.expect(400)

			expect(response.body.message).toBe('INVALID_PASSWORD')
		})

		it('should return validation error for short username', async () => {
			const userData = {
				username: 'ab',
				email: 'test@example.com',
				password: 'TestPassword123!'
			}

			const response = await request(server)
				.post('/api/v1/auth/signup')
				.send(userData)
				.expect(400)

			expect(response.body.message).toBe('INVALID_NAME')
		})
	})
})

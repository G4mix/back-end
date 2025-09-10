import { IntegrationTestSetup } from '@test/setup/integration-test-setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Signin Integration Tests', () => {
	let httpClient: HttpClient
	let baseUrl: string

	beforeAll(async () => {
		// Inicia o servidor real
		baseUrl = await IntegrationTestSetup.startServer()
		httpClient = new HttpClient(baseUrl)
	})

	afterAll(async () => {
		// Para o servidor
		await IntegrationTestSetup.stopServer()
	})

	beforeEach(() => {
		// Limpa mocks antes de cada teste
		IntegrationTestSetup.clearMocks()
	})

	describe('POST /api/v1/auth/signin', () => {
		it('should signin user successfully with valid credentials', async () => {
			// Arrange
			const userData = TestData.createUser()
			
			// Mock do Prisma para retornar usuário existente
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							username: userData.username,
							email: userData.email,
							password: '$2b$10$hashedpassword',
							verified: true,
							created_at: new Date(),
							updated_at: new Date(),
							userProfileId: TestData.generateUUID(),
							loginAttempts: 0,
							blockedUntil: null
						})
					}
				}
			})

			// Act
			const response = await httpClient.post('/api/v1/auth/signin', {
				email: userData.email,
				password: userData.password
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('accessToken')
			expect(response.data).toHaveProperty('refreshToken')
			expect(response.data).toHaveProperty('user')
		})

		it('should return validation error for invalid email format', async () => {
			// Arrange
			const signinData = {
				email: 'invalid-email',
				password: 'Test123!'
			}

			// Act & Assert
			await expect(httpClient.post('/api/v1/auth/signin', signinData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_EMAIL'
						}
					}
				})
		})

		it('should return validation error for empty email', async () => {
			// Arrange
			const signinData = {
				email: '',
				password: 'Test123!'
			}

			// Act & Assert
			await expect(httpClient.post('/api/v1/auth/signin', signinData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'EMAIL_REQUIRED'
						}
					}
				})
		})

		it('should return validation error for empty password', async () => {
			// Arrange
			const signinData = {
				email: 'test@example.com',
				password: ''
			}

			// Act & Assert
			await expect(httpClient.post('/api/v1/auth/signin', signinData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'PASSWORD_REQUIRED'
						}
					}
				})
		})

		it('should return USER_NOT_FOUND when user does not exist', async () => {
			// Arrange
			const signinData = {
				email: 'nonexistent@example.com',
				password: 'Test123!'
			}

			// Mock do Prisma para retornar null
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue(null)
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/auth/signin', signinData))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: {
							message: 'USER_NOT_FOUND'
						}
					}
				})
		})

		it('should return INVALID_CREDENTIALS when password is wrong', async () => {
			// Arrange
			const userData = TestData.createUser()
			const signinData = {
				email: userData.email,
				password: 'WrongPassword123!'
			}

			// Mock do Prisma para retornar usuário existente
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							username: userData.username,
							email: userData.email,
							password: '$2b$10$hashedpassword',
							verified: true,
							created_at: new Date(),
							updated_at: new Date(),
							userProfileId: TestData.generateUUID(),
							loginAttempts: 0,
							blockedUntil: null
						})
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/auth/signin', signinData))
				.rejects.toMatchObject({
					response: {
						status: 401,
						data: {
							message: 'INVALID_CREDENTIALS'
						}
					}
				})
		})

		it('should return USER_NOT_VERIFIED when user is not verified', async () => {
			// Arrange
			const userData = TestData.createUser()
			
			// Mock do Prisma para retornar usuário não verificado
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							username: userData.username,
							email: userData.email,
							password: '$2b$10$hashedpassword',
							verified: false,
							created_at: new Date(),
							updated_at: new Date(),
							userProfileId: TestData.generateUUID(),
							loginAttempts: 0,
							blockedUntil: null
						})
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/auth/signin', {
				email: userData.email,
				password: userData.password
			}))
				.rejects.toMatchObject({
					response: {
						status: 403,
						data: {
							message: 'USER_NOT_VERIFIED'
						}
					}
				})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const signinData = {
				email: 'test@example.com',
				password: 'Test123!'
			}

			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/auth/signin', signinData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

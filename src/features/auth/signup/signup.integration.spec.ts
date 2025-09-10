import { IntegrationTestSetup } from '@test/setup/integration-test-setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Signup Integration Tests', () => {
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

	describe('POST /api/v1/auth/signup', () => {
		it('should create user successfully with valid data', async () => {
			// Arrange
			const userData = TestData.createUser()
			
			// Mock do Prisma para retornar sucesso
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue(null), // Usuário não existe
						create: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							username: userData.username,
							email: userData.email,
							verified: false,
							created_at: new Date(),
							updated_at: new Date(),
							userProfileId: TestData.generateUUID(),
							loginAttempts: 0,
							blockedUntil: null,
							userProfile: {
								id: TestData.generateUUID(),
								name: null,
								bio: null,
								icon: null,
								created_at: new Date(),
								updated_at: new Date()
							}
						})
					}
				}
			})

			// Act
			const response = await httpClient.post('/api/v1/auth/signup', userData)

			// Assert
			expect(response.status).toBe(201)
			expect(response.data).toHaveProperty('accessToken')
			expect(response.data).toHaveProperty('refreshToken')
			expect(response.data).toHaveProperty('user')
			expect(response.data.user.email).toBe(userData.email)
			expect(response.data.user.username).toBe(userData.username)
		})

		it('should return validation error for invalid email format', async () => {
			// Arrange
			const userData = TestData.createUser({ email: 'invalid-email' })

			// Act & Assert
			await expect(httpClient.post('/api/v1/auth/signup', userData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_EMAIL'
						}
					}
				})
		})

		it('should return validation error for weak password', async () => {
			// Arrange
			const userData = TestData.createUser({ password: '123' })

			// Act & Assert
			await expect(httpClient.post('/api/v1/auth/signup', userData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_PASSWORD'
						}
					}
				})
		})

		it('should return validation error for short username', async () => {
			// Arrange
			const userData = TestData.createUser({ username: 'ab' })

			// Act & Assert
			await expect(httpClient.post('/api/v1/auth/signup', userData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_NAME'
						}
					}
				})
		})

		it('should return USER_ALREADY_EXISTS when email already exists', async () => {
			// Arrange
			const userData = TestData.createUser()
			
			// Mock do Prisma para retornar usuário existente
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							email: userData.email
						})
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/auth/signup', userData))
				.rejects.toMatchObject({
					response: {
						status: 409,
						data: {
							message: 'USER_ALREADY_EXISTS'
						}
					}
				})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const userData = TestData.createUser()
			
			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/auth/signup', userData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

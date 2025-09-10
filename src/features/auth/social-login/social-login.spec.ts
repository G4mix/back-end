import { IntegrationTestSetup } from '@test/setup/integration-test-setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Social Login Integration Tests', () => {
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

	describe('POST /api/v1/auth/social-login', () => {
		it('should login with Google successfully', async () => {
			// Arrange
			const socialLoginData = {
				provider: 'google',
				accessToken: 'google-access-token'
			}
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							username: 'testuser',
							email: 'test@example.com',
							verified: true,
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
			const response = await httpClient.post('/api/v1/auth/social-login', socialLoginData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('accessToken')
			expect(response.data).toHaveProperty('refreshToken')
			expect(response.data).toHaveProperty('user')
		})

		it('should login with Facebook successfully', async () => {
			// Arrange
			const socialLoginData = {
				provider: 'facebook',
				accessToken: 'facebook-access-token'
			}
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							username: 'testuser',
							email: 'test@example.com',
							verified: true,
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
			const response = await httpClient.post('/api/v1/auth/social-login', socialLoginData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('accessToken')
			expect(response.data).toHaveProperty('refreshToken')
			expect(response.data).toHaveProperty('user')
		})

		it('should return validation error for empty provider', async () => {
			// Arrange
			const socialLoginData = {
				provider: '',
				accessToken: 'access-token'
			}

			// Act & Assert
			await expect(httpClient.post('/api/v1/auth/social-login', socialLoginData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'PROVIDER_REQUIRED'
						}
					}
				})
		})

		it('should return validation error for empty access token', async () => {
			// Arrange
			const socialLoginData = {
				provider: 'google',
				accessToken: ''
			}

			// Act & Assert
			await expect(httpClient.post('/api/v1/auth/social-login', socialLoginData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'ACCESS_TOKEN_REQUIRED'
						}
					}
				})
		})

		it('should return validation error for invalid provider', async () => {
			// Arrange
			const socialLoginData = {
				provider: 'invalid-provider',
				accessToken: 'access-token'
			}

			// Act & Assert
			await expect(httpClient.post('/api/v1/auth/social-login', socialLoginData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_PROVIDER'
						}
					}
				})
		})

		it('should return INVALID_ACCESS_TOKEN when token is invalid', async () => {
			// Arrange
			const socialLoginData = {
				provider: 'google',
				accessToken: 'invalid-access-token'
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
			await expect(httpClient.post('/api/v1/auth/social-login', socialLoginData))
				.rejects.toMatchObject({
					response: {
						status: 401,
						data: {
							message: 'INVALID_ACCESS_TOKEN'
						}
					}
				})
		})

		it('should return USER_NOT_FOUND when user does not exist', async () => {
			// Arrange
			const socialLoginData = {
				provider: 'google',
				accessToken: 'valid-access-token'
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
			await expect(httpClient.post('/api/v1/auth/social-login', socialLoginData))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: {
							message: 'USER_NOT_FOUND'
						}
					}
				})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const socialLoginData = {
				provider: 'google',
				accessToken: 'access-token'
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
			await expect(httpClient.post('/api/v1/auth/social-login', socialLoginData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

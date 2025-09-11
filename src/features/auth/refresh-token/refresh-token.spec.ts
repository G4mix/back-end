import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Refresh Token Integration Tests', () => {
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

	describe('POST /v1/auth/refresh-token', () => {
		it('should refresh token successfully with valid refresh token', async () => {
			// Arrange
			const refreshTokenData = {
				refreshToken: 'valid-refresh-token'
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
			const response = await httpClient.post('/v1/auth/refresh-token', refreshTokenData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('accessToken')
			expect(response.data).toHaveProperty('refreshToken')
			expect(response.data).toHaveProperty('user')
		})

		it('should return validation error for empty refresh token', async () => {
			// Arrange
			const refreshTokenData = {
				refreshToken: ''
			}

			// Act & Assert
			await expect(httpClient.post('/v1/auth/refresh-token', refreshTokenData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'REFRESH_TOKEN_REQUIRED'
						}
					}
				})
		})

		it('should return INVALID_REFRESH_TOKEN when token is invalid', async () => {
			// Arrange
			const refreshTokenData = {
				refreshToken: 'invalid-refresh-token'
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
			await expect(httpClient.post('/v1/auth/refresh-token', refreshTokenData))
				.rejects.toMatchObject({
					response: {
						status: 401,
						data: {
							message: 'INVALID_REFRESH_TOKEN'
						}
					}
				})
		})

		it('should return USER_NOT_FOUND when user does not exist', async () => {
			// Arrange
			const refreshTokenData = {
				refreshToken: 'valid-refresh-token'
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
			await expect(httpClient.post('/v1/auth/refresh-token', refreshTokenData))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: {
							message: 'USER_NOT_FOUND'
						}
					}
				})
		})

		it('should return USER_NOT_VERIFIED when user is not verified', async () => {
			// Arrange
			const refreshTokenData = {
				refreshToken: 'valid-refresh-token'
			}

			// Mock do Prisma para retornar usuário não verificado
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							username: 'testuser',
							email: 'test@example.com',
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
			await expect(httpClient.post('/v1/auth/refresh-token', refreshTokenData))
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
			const refreshTokenData = {
				refreshToken: 'valid-refresh-token'
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
			await expect(httpClient.post('/v1/auth/refresh-token', refreshTokenData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

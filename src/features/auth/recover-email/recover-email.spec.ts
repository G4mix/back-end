import { IntegrationTestSetup } from '@test/setup/integration-test-setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Recover Email Integration Tests', () => {
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

	describe('POST /api/v1/auth/recover-email', () => {
		it('should send recovery email successfully with valid email', async () => {
			// Arrange
			const recoverEmailData = {
				email: 'test@example.com'
			}
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							email: recoverEmailData.email,
							verified: false
						}),
						update: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							email: recoverEmailData.email,
							verificationCode: '123456'
						})
					}
				}
			})

			// Mock do SES
			IntegrationTestSetup.setupMocks({
				ses: {
					send: jest.fn().mockResolvedValue({ MessageId: 'test-message-id' })
				}
			})

			// Act
			const response = await httpClient.post('/api/v1/auth/recover-email', recoverEmailData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('message')
		})

		it('should return validation error for invalid email format', async () => {
			// Arrange
			const recoverEmailData = {
				email: 'invalid-email'
			}

			// Act & Assert
			await expect(httpClient.post('/api/v1/auth/recover-email', recoverEmailData))
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
			const recoverEmailData = {
				email: ''
			}

			// Act & Assert
			await expect(httpClient.post('/api/v1/auth/recover-email', recoverEmailData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'EMAIL_REQUIRED'
						}
					}
				})
		})

		it('should return USER_NOT_FOUND when user does not exist', async () => {
			// Arrange
			const recoverEmailData = {
				email: 'nonexistent@example.com'
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
			await expect(httpClient.post('/api/v1/auth/recover-email', recoverEmailData))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: {
							message: 'USER_NOT_FOUND'
						}
					}
				})
		})

		it('should return USER_ALREADY_VERIFIED when user is already verified', async () => {
			// Arrange
			const recoverEmailData = {
				email: 'test@example.com'
			}

			// Mock do Prisma para retornar usuário já verificado
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							email: recoverEmailData.email,
							verified: true
						})
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/auth/recover-email', recoverEmailData))
				.rejects.toMatchObject({
					response: {
						status: 409,
						data: {
							message: 'USER_ALREADY_VERIFIED'
						}
					}
				})
		})

		it('should handle SES errors gracefully', async () => {
			// Arrange
			const recoverEmailData = {
				email: 'test@example.com'
			}

			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							email: recoverEmailData.email,
							verified: false
						}),
						update: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							email: recoverEmailData.email,
							verificationCode: '123456'
						})
					}
				}
			})

			// Mock do SES para retornar erro
			IntegrationTestSetup.setupMocks({
				ses: {
					send: jest.fn().mockRejectedValue(new Error('SES service unavailable'))
				}
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/auth/recover-email', recoverEmailData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const recoverEmailData = {
				email: 'test@example.com'
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
			await expect(httpClient.post('/api/v1/auth/recover-email', recoverEmailData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

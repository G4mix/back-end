import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'
import { TestTokens } from '@test/helpers/test-tokens'

describe('Verify Email Code Integration Tests', () => {
	let httpClient: HttpClient
	let baseUrl: string
	let authToken: string

	beforeAll(async () => {
		// Inicia o servidor real
		baseUrl = await IntegrationTestSetup.startServer()
		httpClient = new HttpClient(baseUrl)
		
		// Simula login para obter token
		authToken = TestTokens.generateValidToken()
		httpClient.setAuthToken(authToken)
	})

	afterAll(async () => {
		// Para o servidor
		await IntegrationTestSetup.stopServer()
	})

	beforeEach(() => {
		// Mocks são configurados individualmente nos testes
	})

	describe('POST /v1/auth/verify-email-code', () => {
		it('should verify email code successfully with valid data', async () => {
			// Arrange
			const verifyData = TestData.createVerifyEmailCodeData()
			
			// Mock do Prisma para autenticação
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'test@example.com',
				username: 'testuser',
				verified: true,
				created_at: new Date(),
				updated_at: new Date(),
				userCode: {
					code: verifyData.code,
					updated_at: new Date()
				}
			})

			// Act
			const response = await httpClient.post('/v1/auth/verify-email-code', verifyData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('accessToken')
			expect(typeof response.data.accessToken).toBe('string')
		})

		it('should return validation error for empty code', async () => {
			// Arrange
			const verifyData = TestData.createVerifyEmailCodeData({ code: '' })

			// Act & Assert
			await expect(httpClient.post('/v1/auth/verify-email-code', verifyData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'CODE_REQUIRED'
						}
					}
				})
		})

		it('should return validation error for empty email', async () => {
			// Arrange
			const verifyData = TestData.createVerifyEmailCodeData({ email: '' })

			// Act & Assert
			await expect(httpClient.post('/v1/auth/verify-email-code', verifyData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_EMAIL'
						}
					}
				})
		})

		it('should return USER_NOT_FOUND when user does not exist', async () => {
			// Arrange
			const verifyData = TestData.createVerifyEmailCodeData()
			
			// Mock do Prisma para retornar null
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockResolvedValue(null)

			// Act & Assert
			await expect(httpClient.post('/v1/auth/verify-email-code', verifyData))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: 'USER_NOT_FOUND'
					}
				})
		})

		it('should return CODE_EXPIRED when code is expired', async () => {
			// Arrange
			const verifyData = TestData.createVerifyEmailCodeData()
			
			// Mock do Prisma para retornar código expirado
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			const expiredDate = new Date(Date.now() - 11 * 60 * 1000) // 11 minutos atrás
			mockPrismaClient.user.findUnique.mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'test@example.com',
				username: 'testuser',
				verified: true,
				created_at: new Date(),
				updated_at: new Date(),
				userCode: {
					code: verifyData.code,
					updated_at: expiredDate
				}
			})

			// Act & Assert
			await expect(httpClient.post('/v1/auth/verify-email-code', verifyData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: 'CODE_EXPIRED'
					}
				})
		})

		it('should return CODE_NOT_EQUALS when code does not match', async () => {
			// Arrange
			const verifyData = TestData.createVerifyEmailCodeData()
			
			// Mock do Prisma para retornar código diferente
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'test@example.com',
				username: 'testuser',
				verified: true,
				created_at: new Date(),
				updated_at: new Date(),
				userCode: {
					code: 'DIFFERENT_CODE',
					updated_at: new Date()
				}
			})

			// Act & Assert
			await expect(httpClient.post('/v1/auth/verify-email-code', verifyData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: 'CODE_NOT_EQUALS'
					}
				})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const verifyData = TestData.createVerifyEmailCodeData()
			
			// Mock do Prisma para retornar erro
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockRejectedValue(new Error('Database connection failed'))

			// Act & Assert
			await expect(httpClient.post('/v1/auth/verify-email-code', verifyData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

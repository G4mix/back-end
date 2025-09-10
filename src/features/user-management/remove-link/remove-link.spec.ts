import { IntegrationTestSetup } from '@test/setup/integration-test-setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Remove Link Integration Tests', () => {
	let httpClient: HttpClient
	let baseUrl: string
	let authToken: string

	beforeAll(async () => {
		// Inicia o servidor real
		baseUrl = await IntegrationTestSetup.startServer()
		httpClient = new HttpClient(baseUrl)
		
		// Simula login para obter token
		authToken = TestData.generateFakeToken()
		httpClient.setAuthToken(authToken)
	})

	afterAll(async () => {
		// Para o servidor
		await IntegrationTestSetup.stopServer()
	})

	beforeEach(() => {
		// Limpa mocks antes de cada teste
		IntegrationTestSetup.clearMocks()
	})

	describe('DELETE /api/v1/users/links/:linkId', () => {
		it('should remove personal link successfully', async () => {
			// Arrange
			const linkId = TestData.generateUUID()
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					link: {
						findFirst: jest.fn().mockResolvedValue({
							id: linkId,
							url: 'https://github.com/testuser',
							userId: TestData.generateUUID()
						}),
						delete: jest.fn().mockResolvedValue({
							id: linkId
						})
					}
				}
			})

			// Act
			const response = await httpClient.delete(`/api/v1/users/links/${linkId}`)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('message')
		})

		it('should return validation error for invalid link ID', async () => {
			// Act & Assert
			await expect(httpClient.delete('/api/v1/users/links/invalid-uuid'))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_LINK_ID'
						}
					}
				})
		})

		it('should return UNAUTHORIZED when no token provided', async () => {
			// Arrange
			const linkId = TestData.generateUUID()
			httpClient.clearAuthToken()

			// Act & Assert
			await expect(httpClient.delete(`/api/v1/users/links/${linkId}`))
				.rejects.toMatchObject({
					response: {
						status: 401,
						data: {
							message: 'UNAUTHORIZED'
						}
					}
				})
		})

		it('should return LINK_NOT_FOUND when link does not exist', async () => {
			// Arrange
			const linkId = TestData.generateUUID()

			// Mock do Prisma para retornar null
			IntegrationTestSetup.setupMocks({
				prisma: {
					link: {
						findFirst: jest.fn().mockResolvedValue(null)
					}
				}
			})

			// Act & Assert
			await expect(httpClient.delete(`/api/v1/users/links/${linkId}`))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: {
							message: 'LINK_NOT_FOUND'
						}
					}
				})
		})

		it('should return FORBIDDEN when user is not the owner of the link', async () => {
			// Arrange
			const linkId = TestData.generateUUID()

			// Mock do Prisma para retornar link de outro usuário
			IntegrationTestSetup.setupMocks({
				prisma: {
					link: {
						findFirst: jest.fn().mockResolvedValue({
							id: linkId,
							url: 'https://github.com/testuser',
							userId: 'different-user-id'
						})
					}
				}
			})

			// Act & Assert
			await expect(httpClient.delete(`/api/v1/users/links/${linkId}`))
				.rejects.toMatchObject({
					response: {
						status: 403,
						data: {
							message: 'FORBIDDEN'
						}
					}
				})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const linkId = TestData.generateUUID()

			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					link: {
						findFirst: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.delete(`/api/v1/users/links/${linkId}`))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

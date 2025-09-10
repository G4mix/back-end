import { IntegrationTestSetup } from '@test/setup/integration-test-setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Toggle Like Integration Tests', () => {
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

	describe('POST /api/v1/likes/toggle', () => {
		it('should like idea successfully', async () => {
			// Arrange
			const likeData = {
				ideaId: TestData.generateUUID()
			}
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					like: {
						findFirst: jest.fn().mockResolvedValue(null), // Like não existe
						create: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							ideaId: likeData.ideaId,
							userId: TestData.generateUUID(),
							created_at: new Date()
						})
					}
				}
			})

			// Act
			const response = await httpClient.post('/api/v1/likes/toggle', likeData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('liked')
			expect(response.data.liked).toBe(true)
		})

		it('should unlike idea successfully', async () => {
			// Arrange
			const likeData = {
				ideaId: TestData.generateUUID()
			}
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					like: {
						findFirst: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							ideaId: likeData.ideaId,
							userId: TestData.generateUUID(),
							created_at: new Date()
						}), // Like existe
						delete: jest.fn().mockResolvedValue({
							id: TestData.generateUUID()
						})
					}
				}
			})

			// Act
			const response = await httpClient.post('/api/v1/likes/toggle', likeData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('liked')
			expect(response.data.liked).toBe(false)
		})

		it('should like comment successfully', async () => {
			// Arrange
			const likeData = {
				commentId: TestData.generateUUID()
			}
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					like: {
						findFirst: jest.fn().mockResolvedValue(null), // Like não existe
						create: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							commentId: likeData.commentId,
							userId: TestData.generateUUID(),
							created_at: new Date()
						})
					}
				}
			})

			// Act
			const response = await httpClient.post('/api/v1/likes/toggle', likeData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('liked')
			expect(response.data.liked).toBe(true)
		})

		it('should return validation error for invalid idea ID', async () => {
			// Arrange
			const likeData = {
				ideaId: 'invalid-uuid'
			}

			// Act & Assert
			await expect(httpClient.post('/api/v1/likes/toggle', likeData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_IDEA_ID'
						}
					}
				})
		})

		it('should return validation error for invalid comment ID', async () => {
			// Arrange
			const likeData = {
				commentId: 'invalid-uuid'
			}

			// Act & Assert
			await expect(httpClient.post('/api/v1/likes/toggle', likeData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_COMMENT_ID'
						}
					}
				})
		})

		it('should return validation error when neither ideaId nor commentId provided', async () => {
			// Arrange
			const likeData = {}

			// Act & Assert
			await expect(httpClient.post('/api/v1/likes/toggle', likeData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'IDEA_OR_COMMENT_ID_REQUIRED'
						}
					}
				})
		})

		it('should return validation error when both ideaId and commentId provided', async () => {
			// Arrange
			const likeData = {
				ideaId: TestData.generateUUID(),
				commentId: TestData.generateUUID()
			}

			// Act & Assert
			await expect(httpClient.post('/api/v1/likes/toggle', likeData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'ONLY_ONE_ID_ALLOWED'
						}
					}
				})
		})

		it('should return UNAUTHORIZED when no token provided', async () => {
			// Arrange
			const likeData = {
				ideaId: TestData.generateUUID()
			}
			httpClient.clearAuthToken()

			// Act & Assert
			await expect(httpClient.post('/api/v1/likes/toggle', likeData))
				.rejects.toMatchObject({
					response: {
						status: 401,
						data: {
							message: 'UNAUTHORIZED'
						}
					}
				})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const likeData = {
				ideaId: TestData.generateUUID()
			}

			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					like: {
						findFirst: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/likes/toggle', likeData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

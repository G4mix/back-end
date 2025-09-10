import { IntegrationTestSetup } from '@test/setup/integration-test-setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Toggle Follow Integration Tests', () => {
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

	describe('POST /api/v1/follow/toggle', () => {
		it('should follow user successfully', async () => {
			// Arrange
			const followData = {
				userId: TestData.generateUUID()
			}
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					follow: {
						findFirst: jest.fn().mockResolvedValue(null), // Follow não existe
						create: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							followerId: TestData.generateUUID(),
							followingId: followData.userId,
							created_at: new Date()
						})
					}
				}
			})

			// Act
			const response = await httpClient.post('/api/v1/follow/toggle', followData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('following')
			expect(response.data.following).toBe(true)
		})

		it('should unfollow user successfully', async () => {
			// Arrange
			const followData = {
				userId: TestData.generateUUID()
			}
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					follow: {
						findFirst: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							followerId: TestData.generateUUID(),
							followingId: followData.userId,
							created_at: new Date()
						}), // Follow existe
						delete: jest.fn().mockResolvedValue({
							id: TestData.generateUUID()
						})
					}
				}
			})

			// Act
			const response = await httpClient.post('/api/v1/follow/toggle', followData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('following')
			expect(response.data.following).toBe(false)
		})

		it('should return validation error for invalid user ID', async () => {
			// Arrange
			const followData = {
				userId: 'invalid-uuid'
			}

			// Act & Assert
			await expect(httpClient.post('/api/v1/follow/toggle', followData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_USER_ID'
						}
					}
				})
		})

		it('should return validation error for empty user ID', async () => {
			// Arrange
			const followData = {
				userId: ''
			}

			// Act & Assert
			await expect(httpClient.post('/api/v1/follow/toggle', followData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'USER_ID_REQUIRED'
						}
					}
				})
		})

		it('should return UNAUTHORIZED when no token provided', async () => {
			// Arrange
			const followData = {
				userId: TestData.generateUUID()
			}
			httpClient.clearAuthToken()

			// Act & Assert
			await expect(httpClient.post('/api/v1/follow/toggle', followData))
				.rejects.toMatchObject({
					response: {
						status: 401,
						data: {
							message: 'UNAUTHORIZED'
						}
					}
				})
		})

		it('should return USER_NOT_FOUND when user to follow does not exist', async () => {
			// Arrange
			const followData = {
				userId: TestData.generateUUID()
			}

			// Mock do Prisma para retornar null
			IntegrationTestSetup.setupMocks({
				prisma: {
					follow: {
						findFirst: jest.fn().mockResolvedValue(null)
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/follow/toggle', followData))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: {
							message: 'USER_NOT_FOUND'
						}
					}
				})
		})

		it('should return CANNOT_FOLLOW_SELF when trying to follow yourself', async () => {
			// Arrange
			const followData = {
				userId: TestData.generateUUID()
			}

			// Mock do Prisma para retornar erro de auto-follow
			IntegrationTestSetup.setupMocks({
				prisma: {
					follow: {
						findFirst: jest.fn().mockResolvedValue(null)
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/follow/toggle', followData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'CANNOT_FOLLOW_SELF'
						}
					}
				})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const followData = {
				userId: TestData.generateUUID()
			}

			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					follow: {
						findFirst: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/follow/toggle', followData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

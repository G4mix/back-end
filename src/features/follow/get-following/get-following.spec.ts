import { IntegrationTestSetup } from '@test/setup/integration-test-setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Get Following Integration Tests', () => {
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

	describe('GET /api/v1/follow/following/:userId', () => {
		it('should get following with pagination successfully', async () => {
			// Arrange
			const userId = TestData.generateUUID()
			const mockFollowing = [
				{
					id: TestData.generateUUID(),
					followerId: userId,
					followingId: TestData.generateUUID(),
					created_at: new Date(),
					following: {
						id: TestData.generateUUID(),
						username: 'following1',
						email: 'following1@example.com',
						userProfile: {
							name: 'Following 1',
							bio: 'Bio of following 1',
							icon: 'https://example.com/following1.jpg'
						}
					}
				},
				{
					id: TestData.generateUUID(),
					followerId: userId,
					followingId: TestData.generateUUID(),
					created_at: new Date(),
					following: {
						id: TestData.generateUUID(),
						username: 'following2',
						email: 'following2@example.com',
						userProfile: {
							name: 'Following 2',
							bio: 'Bio of following 2',
							icon: 'https://example.com/following2.jpg'
						}
					}
				}
			]

			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					follow: {
						findMany: jest.fn().mockResolvedValue(mockFollowing),
						count: jest.fn().mockResolvedValue(2)
					}
				}
			})

			// Act
			const response = await httpClient.get(`/api/v1/follow/following/${userId}`, {
				page: 0,
				limit: 10
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('following')
			expect(response.data).toHaveProperty('pagination')
			expect(response.data.following).toHaveLength(2)
			expect(response.data.pagination.total).toBe(2)
		})

		it('should return validation error for invalid user ID', async () => {
			// Act & Assert
			await expect(httpClient.get('/api/v1/follow/following/invalid-uuid'))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_USER_ID'
						}
					}
				})
		})

		it('should return validation error for invalid page number', async () => {
			// Arrange
			const userId = TestData.generateUUID()

			// Act & Assert
			await expect(httpClient.get(`/api/v1/follow/following/${userId}`, { page: -1 }))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_PAGE'
						}
					}
				})
		})

		it('should return validation error for invalid limit', async () => {
			// Arrange
			const userId = TestData.generateUUID()

			// Act & Assert
			await expect(httpClient.get(`/api/v1/follow/following/${userId}`, { limit: 200 }))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'LIMIT_TOO_LARGE'
						}
					}
				})
		})

		it('should return empty array when no following found', async () => {
			// Arrange
			const userId = TestData.generateUUID()

			// Mock do Prisma para retornar array vazio
			IntegrationTestSetup.setupMocks({
				prisma: {
					follow: {
						findMany: jest.fn().mockResolvedValue([]),
						count: jest.fn().mockResolvedValue(0)
					}
				}
			})

			// Act
			const response = await httpClient.get(`/api/v1/follow/following/${userId}`, {
				page: 0,
				limit: 10
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.following).toHaveLength(0)
			expect(response.data.pagination.total).toBe(0)
		})

		it('should get following sorted by follow date', async () => {
			// Arrange
			const userId = TestData.generateUUID()
			const mockFollowing = [
				{
					id: TestData.generateUUID(),
					followerId: userId,
					followingId: TestData.generateUUID(),
					created_at: new Date('2024-01-02'),
					following: {
						id: TestData.generateUUID(),
						username: 'newfollowing',
						email: 'newfollowing@example.com',
						userProfile: {
							name: 'New Following',
							bio: 'Bio of new following',
							icon: 'https://example.com/newfollowing.jpg'
						}
					}
				},
				{
					id: TestData.generateUUID(),
					followerId: userId,
					followingId: TestData.generateUUID(),
					created_at: new Date('2024-01-01'),
					following: {
						id: TestData.generateUUID(),
						username: 'oldfollowing',
						email: 'oldfollowing@example.com',
						userProfile: {
							name: 'Old Following',
							bio: 'Bio of old following',
							icon: 'https://example.com/oldfollowing.jpg'
						}
					}
				}
			]

			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					follow: {
						findMany: jest.fn().mockResolvedValue(mockFollowing),
						count: jest.fn().mockResolvedValue(2)
					}
				}
			})

			// Act
			const response = await httpClient.get(`/api/v1/follow/following/${userId}`, {
				page: 0,
				limit: 10
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.following).toHaveLength(2)
			expect(response.data.following[0].following.username).toBe('newfollowing')
			expect(response.data.following[1].following.username).toBe('oldfollowing')
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const userId = TestData.generateUUID()

			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					follow: {
						findMany: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.get(`/api/v1/follow/following/${userId}`, { page: 0, limit: 10 }))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Get Followers Integration Tests', () => {
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

	describe('GET /v1/follow/followers/:userId', () => {
		it('should get followers with pagination successfully', async () => {
			// Arrange
			const userId = TestData.generateUUID()
			const mockFollowers = [
				{
					id: TestData.generateUUID(),
					followerId: TestData.generateUUID(),
					followingId: userId,
					created_at: new Date(),
					follower: {
						id: TestData.generateUUID(),
						username: 'follower1',
						email: 'follower1@example.com',
						userProfile: {
							name: 'Follower 1',
							bio: 'Bio of follower 1',
							icon: 'https://example.com/follower1.jpg'
						}
					}
				},
				{
					id: TestData.generateUUID(),
					followerId: TestData.generateUUID(),
					followingId: userId,
					created_at: new Date(),
					follower: {
						id: TestData.generateUUID(),
						username: 'follower2',
						email: 'follower2@example.com',
						userProfile: {
							name: 'Follower 2',
							bio: 'Bio of follower 2',
							icon: 'https://example.com/follower2.jpg'
						}
					}
				}
			]

			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					follow: {
						findMany: jest.fn().mockResolvedValue(mockFollowers),
						count: jest.fn().mockResolvedValue(2)
					}
				}
			})

			// Act
			const response = await httpClient.get(`/v1/follow/followers/${userId}`, {
				page: 0,
				limit: 10
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('followers')
			expect(response.data).toHaveProperty('pagination')
			expect(response.data.followers).toHaveLength(2)
			expect(response.data.pagination.total).toBe(2)
		})

		it('should return validation error for invalid user ID', async () => {
			// Act & Assert
			await expect(httpClient.get('/v1/follow/followers/invalid-uuid'))
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
			await expect(httpClient.get(`/v1/follow/followers/${userId}`, { page: -1 }))
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
			await expect(httpClient.get(`/v1/follow/followers/${userId}`, { limit: 200 }))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'LIMIT_TOO_LARGE'
						}
					}
				})
		})

		it('should return empty array when no followers found', async () => {
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
			const response = await httpClient.get(`/v1/follow/followers/${userId}`, {
				page: 0,
				limit: 10
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.followers).toHaveLength(0)
			expect(response.data.pagination.total).toBe(0)
		})

		it('should get followers sorted by follow date', async () => {
			// Arrange
			const userId = TestData.generateUUID()
			const mockFollowers = [
				{
					id: TestData.generateUUID(),
					followerId: TestData.generateUUID(),
					followingId: userId,
					created_at: new Date('2024-01-02'),
					follower: {
						id: TestData.generateUUID(),
						username: 'newfollower',
						email: 'newfollower@example.com',
						userProfile: {
							name: 'New Follower',
							bio: 'Bio of new follower',
							icon: 'https://example.com/newfollower.jpg'
						}
					}
				},
				{
					id: TestData.generateUUID(),
					followerId: TestData.generateUUID(),
					followingId: userId,
					created_at: new Date('2024-01-01'),
					follower: {
						id: TestData.generateUUID(),
						username: 'oldfollower',
						email: 'oldfollower@example.com',
						userProfile: {
							name: 'Old Follower',
							bio: 'Bio of old follower',
							icon: 'https://example.com/oldfollower.jpg'
						}
					}
				}
			]

			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					follow: {
						findMany: jest.fn().mockResolvedValue(mockFollowers),
						count: jest.fn().mockResolvedValue(2)
					}
				}
			})

			// Act
			const response = await httpClient.get(`/v1/follow/followers/${userId}`, {
				page: 0,
				limit: 10
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.followers).toHaveLength(2)
			expect(response.data.followers[0].follower.username).toBe('newfollower')
			expect(response.data.followers[1].follower.username).toBe('oldfollower')
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
			await expect(httpClient.get(`/v1/follow/followers/${userId}`, { page: 0, limit: 10 }))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

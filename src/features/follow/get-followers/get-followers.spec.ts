import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'
import { TestTokens } from '@test/helpers/test-tokens'

describe('Get Followers Integration Tests', () => {
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
		// Limpa mocks antes de cada teste
		IntegrationTestSetup.clearMocks()
		
		// Mock do usuário para autenticação
		const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
		mockPrismaClient.user.findUnique.mockResolvedValue({
			id: 'user-123',
			userProfileId: 'profile-123',
			email: 'test@example.com',
			username: 'testuser',
			verified: true,
			created_at: new Date(),
			updated_at: new Date()
		})
		
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
					followerUser: {
						id: TestData.generateUUID(),
						displayName: 'Follower 1',
						icon: 'https://example.com/follower1.jpg',
						user: {
							username: 'follower1'
						}
					}
				},
				{
					id: TestData.generateUUID(),
					followerId: TestData.generateUUID(),
					followingId: userId,
					created_at: new Date(),
					followerUser: {
						id: TestData.generateUUID(),
						displayName: 'Follower 2',
						icon: 'https://example.com/follower2.jpg',
						user: {
							username: 'follower2'
						}
					}
				}
			]

			// Mock do Prisma para FollowRepository.findFollowers
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.follow.findMany.mockResolvedValue(mockFollowers)
			mockPrismaClient.follow.count.mockResolvedValue(2)

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
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.follow.findMany.mockResolvedValue([])
			mockPrismaClient.follow.count.mockResolvedValue(0)

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
					followerUser: {
						id: TestData.generateUUID(),
						displayName: 'New Follower',
						icon: 'https://example.com/newfollower.jpg',
						user: {
							username: 'newfollower'
						}
					}
				},
				{
					id: TestData.generateUUID(),
					followerId: TestData.generateUUID(),
					followingId: userId,
					created_at: new Date('2024-01-01'),
					followerUser: {
						id: TestData.generateUUID(),
						displayName: 'Old Follower',
						icon: 'https://example.com/oldfollower.jpg',
						user: {
							username: 'oldfollower'
						}
					}
				}
			]

			// Mock do Prisma para FollowRepository.findFollowers
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.follow.findMany.mockResolvedValue(mockFollowers)
			mockPrismaClient.follow.count.mockResolvedValue(2)

			// Act
			const response = await httpClient.get(`/v1/follow/followers/${userId}`, {
				page: 0,
				limit: 10
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.followers).toHaveLength(2)
			expect(response.data.followers[0].followerUser.username).toBe('newfollower')
			expect(response.data.followers[1].followerUser.username).toBe('oldfollower')
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const userId = TestData.generateUUID()

			// Mock do Prisma para retornar erro
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.follow.findMany.mockRejectedValueOnce(new Error('Database connection failed'))

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

import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'
import { TestTokens } from '@test/helpers/test-tokens'

describe('Get Following Integration Tests', () => {
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

	describe('GET /v1/follow/following/:userId', () => {
		it('should get following with pagination successfully', async () => {
			// Arrange
			const userId = TestData.generateUUID()
			const mockFollowing = [
				{
					id: TestData.generateUUID(),
					followerId: userId,
					followingId: TestData.generateUUID(),
					created_at: new Date(),
					followingUser: {
						id: TestData.generateUUID(),
						displayName: 'Following 1',
						icon: 'https://example.com/following1.jpg',
						user: {
							username: 'following1'
						}
					}
				},
				{
					id: TestData.generateUUID(),
					followerId: userId,
					followingId: TestData.generateUUID(),
					created_at: new Date(),
					followingUser: {
						id: TestData.generateUUID(),
						displayName: 'Following 2',
						icon: 'https://example.com/following2.jpg',
						user: {
							username: 'following2'
						}
					}
				}
			]

			// Mock do Prisma para FollowRepository.findFollowing
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.follow.findMany.mockResolvedValueOnce(mockFollowing)
			mockPrismaClient.follow.count.mockResolvedValueOnce(2)

			// Act
			const response = await httpClient.get(`/v1/follow/following/${userId}`, {
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
			await expect(httpClient.get('/v1/follow/following/invalid-uuid'))
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
			await expect(httpClient.get(`/v1/follow/following/${userId}`, { page: -1 }))
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
			await expect(httpClient.get(`/v1/follow/following/${userId}`, { limit: 200 }))
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
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.follow.findMany.mockResolvedValueOnce([])
			mockPrismaClient.follow.count.mockResolvedValueOnce(0)

			// Act
			const response = await httpClient.get(`/v1/follow/following/${userId}`, {
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
					followingUser: {
						id: TestData.generateUUID(),
						displayName: 'New Following',
						icon: 'https://example.com/newfollowing.jpg',
						user: {
							username: 'newfollowing'
						}
					}
				},
				{
					id: TestData.generateUUID(),
					followerId: userId,
					followingId: TestData.generateUUID(),
					created_at: new Date('2024-01-01'),
					followingUser: {
						id: TestData.generateUUID(),
						displayName: 'Old Following',
						icon: 'https://example.com/oldfollowing.jpg',
						user: {
							username: 'oldfollowing'
						}
					}
				}
			]

			// Mock do Prisma para FollowRepository.findFollowing
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.follow.findMany.mockResolvedValueOnce(mockFollowing)
			mockPrismaClient.follow.count.mockResolvedValueOnce(2)

			// Act
			const response = await httpClient.get(`/v1/follow/following/${userId}`, {
				page: 0,
				limit: 10
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.following).toHaveLength(2)
			expect(response.data.following[0].followingUser.username).toBe('newfollowing')
			expect(response.data.following[1].followingUser.username).toBe('oldfollowing')
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const userId = TestData.generateUUID()

			// Mock do Prisma para retornar erro
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.follow.findMany.mockRejectedValueOnce(new Error('Database connection failed'))

			// Act & Assert
			await expect(httpClient.get(`/v1/follow/following/${userId}`, { page: 0, limit: 10 }))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

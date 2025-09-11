import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'
import { TestTokens } from '@test/helpers/test-tokens'

describe('Get User By ID Integration Tests', () => {
	let httpClient: HttpClient
	let baseUrl: string
	let authToken: string

	beforeAll(async () => {
		// Usa o servidor global
		baseUrl = IntegrationTestSetup.getBaseUrl()
		httpClient = new HttpClient(baseUrl)
		
		// Gera token válido usando o helper
		authToken = TestTokens.generateValidToken()
		httpClient.setAuthToken(authToken)
	})

	beforeEach(() => {
		// Limpa mocks antes de cada teste
		IntegrationTestSetup.clearMocks()
	})

	describe('GET /v1/users/:id', () => {
		it('should get user by id successfully', async () => {
			// Arrange
			const userId = TestData.generateUUID()
			const mockUser = {
				id: userId,
				username: 'testuser',
				email: 'test@example.com',
				verified: true,
				created_at: new Date(),
				updated_at: new Date(),
				userProfile: {
					id: TestData.generateUUID(),
					displayName: 'Test User',
					autobiography: 'Bio of test user',
					icon: 'https://example.com/user.jpg',
					backgroundImage: 'https://example.com/background.jpg',
					links: [],
					_count: {
						followers: 10,
						following: 5
					}
				}
			}

			// Mock do Prisma
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)

			// Act
			const response = await httpClient.get(`/v1/users/${userId}`)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('user')
			expect(response.data.user.id).toBe(userId)
			expect(response.data.user.username).toBe('testuser')
			expect(response.data.user.email).toBe('test@example.com')
			expect(response.data.user.userProfile.displayName).toBe('Test User')
		})

		it('should return validation error for invalid UUID', async () => {
			// Act & Assert
			await expect(httpClient.get('/v1/users/invalid-uuid'))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_USER_ID'
						}
					}
				})
		})

		it('should return USER_NOT_FOUND when user does not exist', async () => {
			// Arrange
			const userId = TestData.generateUUID()

			// Mock do Prisma para retornar null
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockResolvedValue(null)

			// Act & Assert
			await expect(httpClient.get(`/v1/users/${userId}`))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: {
							message: 'USER_NOT_FOUND'
						}
					}
				})
		})

		it('should get user with all profile information', async () => {
			// Arrange
			const userId = TestData.generateUUID()
			const mockUser = {
				id: userId,
				username: 'completeuser',
				email: 'complete@example.com',
				verified: true,
				created_at: new Date(),
				updated_at: new Date(),
				userProfile: {
					id: TestData.generateUUID(),
					displayName: 'Complete User',
					autobiography: 'This is a complete user profile with all information filled out',
					icon: 'https://example.com/complete-user.jpg',
					backgroundImage: 'https://example.com/complete-background.jpg',
					links: [],
					_count: {
						followers: 25,
						following: 12
					}
				}
			}

			// Mock do Prisma
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)

			// Act
			const response = await httpClient.get(`/v1/users/${userId}`)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.user.userProfile.displayName).toBe('Complete User')
			expect(response.data.user.userProfile.autobiography).toBe('This is a complete user profile with all information filled out')
			expect(response.data.user.userProfile.icon).toBe('https://example.com/complete-user.jpg')
			expect(response.data.user.userProfile.backgroundImage).toBe('https://example.com/complete-background.jpg')
			expect(response.data.user.userProfile._count.followers).toBe(25)
			expect(response.data.user.userProfile._count.following).toBe(12)
		})

		it('should get user with minimal profile information', async () => {
			// Arrange
			const userId = TestData.generateUUID()
			const mockUser = {
				id: userId,
				username: 'minimaluser',
				email: 'minimal@example.com',
				verified: false,
				created_at: new Date(),
				updated_at: new Date(),
				userProfile: {
					id: TestData.generateUUID(),
					displayName: null,
					autobiography: null,
					icon: null,
					backgroundImage: null,
					links: [],
					_count: {
						followers: 0,
						following: 0
					}
				}
			}

			// Mock do Prisma
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)

			// Act
			const response = await httpClient.get(`/v1/users/${userId}`)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.user.username).toBe('minimaluser')
			expect(response.data.user.verified).toBe(false)
			expect(response.data.user.userProfile.displayName).toBeNull()
			expect(response.data.user.userProfile.autobiography).toBeNull()
			expect(response.data.user.userProfile.icon).toBeNull()
			expect(response.data.user.userProfile.backgroundImage).toBeNull()
			expect(response.data.user.userProfile._count.followers).toBe(0)
			expect(response.data.user.userProfile._count.following).toBe(0)
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const userId = TestData.generateUUID()

			// Mock do Prisma para retornar erro
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockRejectedValue(new Error('Database connection failed'))

			// Act & Assert
			await expect(httpClient.get(`/v1/users/${userId}`))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

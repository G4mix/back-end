import { IntegrationTestSetup } from '@test/setup/integration-test-setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Get User By ID Integration Tests', () => {
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

	describe('GET /api/v1/users/:id', () => {
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
					name: 'Test User',
					bio: 'Bio of test user',
					icon: 'https://example.com/user.jpg',
					backgroundImage: 'https://example.com/background.jpg'
				},
				_count: {
					followers: 10,
					following: 5
				}
			}

			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue(mockUser)
					}
				}
			})

			// Act
			const response = await httpClient.get(`/api/v1/users/${userId}`)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('user')
			expect(response.data.user.id).toBe(userId)
			expect(response.data.user.username).toBe('testuser')
			expect(response.data.user.email).toBe('test@example.com')
			expect(response.data.user.userProfile.name).toBe('Test User')
		})

		it('should return validation error for invalid UUID', async () => {
			// Act & Assert
			await expect(httpClient.get('/api/v1/users/invalid-uuid'))
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
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue(null)
					}
				}
			})

			// Act & Assert
			await expect(httpClient.get(`/api/v1/users/${userId}`))
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
					name: 'Complete User',
					bio: 'This is a complete user profile with all information filled out',
					icon: 'https://example.com/complete-user.jpg',
					backgroundImage: 'https://example.com/complete-background.jpg'
				},
				_count: {
					followers: 25,
					following: 12
				}
			}

			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue(mockUser)
					}
				}
			})

			// Act
			const response = await httpClient.get(`/api/v1/users/${userId}`)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.user.userProfile.name).toBe('Complete User')
			expect(response.data.user.userProfile.bio).toBe('This is a complete user profile with all information filled out')
			expect(response.data.user.userProfile.icon).toBe('https://example.com/complete-user.jpg')
			expect(response.data.user.userProfile.backgroundImage).toBe('https://example.com/complete-background.jpg')
			expect(response.data.user._count.followers).toBe(25)
			expect(response.data.user._count.following).toBe(12)
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
					name: null,
					bio: null,
					icon: null,
					backgroundImage: null
				},
				_count: {
					followers: 0,
					following: 0
				}
			}

			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue(mockUser)
					}
				}
			})

			// Act
			const response = await httpClient.get(`/api/v1/users/${userId}`)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.user.username).toBe('minimaluser')
			expect(response.data.user.verified).toBe(false)
			expect(response.data.user.userProfile.name).toBeNull()
			expect(response.data.user.userProfile.bio).toBeNull()
			expect(response.data.user.userProfile.icon).toBeNull()
			expect(response.data.user.userProfile.backgroundImage).toBeNull()
			expect(response.data.user._count.followers).toBe(0)
			expect(response.data.user._count.following).toBe(0)
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const userId = TestData.generateUUID()

			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.get(`/api/v1/users/${userId}`))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

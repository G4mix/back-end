import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'
import { TestTokens } from '@test/helpers/test-tokens'

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

	describe('POST /v1/follow/toggle', () => {
		it('should follow user successfully', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)
			
			const followData = {
				followingId: TestData.generateUUID()
			}
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue({
							id: 'user-123',
							userProfileId: TestData.generateUUID(),
							email: 'test@example.com'
						})
					},
					follow: {
						findFirst: jest.fn().mockResolvedValue(null), // Follow não existe
						create: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							followerId: TestData.generateUUID(),
							followingId: followData.followingId,
							created_at: new Date()
						})
					}
				}
			})

			// Act
			const response = await httpClient.post('/v1/follow/toggle', followData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('following')
			expect(response.data.following).toBe(true)
		})

		it('should unfollow user successfully', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)
			
			const followData = {
				followingId: TestData.generateUUID()
			}
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue({
							id: 'user-123',
							userProfileId: TestData.generateUUID(),
							email: 'test@example.com'
						})
					},
					follow: {
						findFirst: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							followerId: TestData.generateUUID(),
							followingId: followData.followingId,
							created_at: new Date()
						}), // Follow existe
						delete: jest.fn().mockResolvedValue({
							id: TestData.generateUUID()
						})
					}
				}
			})

			// Act
			const response = await httpClient.post('/v1/follow/toggle', followData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('following')
			expect(response.data.following).toBe(false)
		})

		it('should return validation error for invalid user ID', async () => {
			// Arrange
			const followData = {
				followingId: 'invalid-uuid'
			}

			// Act & Assert
			await expect(httpClient.post('/v1/follow/toggle', followData))
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
				followingId: ''
			}

			// Act & Assert
			await expect(httpClient.post('/v1/follow/toggle', followData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_USER_ID'
						}
					}
				})
		})

		it('should return UNAUTHORIZED when no token provided', async () => {
			// Arrange
			const followData = {
				followingId: TestData.generateUUID()
			}
			httpClient.clearAuthToken()

			// Act & Assert
			await expect(httpClient.post('/v1/follow/toggle', followData))
				.rejects.toMatchObject({
					response: {
						status: 401,
						data: {
							message: 'UNAUTHORIZED'
						}
					}
				})
		})

		it('should return TARGET_NOT_FOUND when user to follow does not exist', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)
			
			const followData = {
				followingId: TestData.generateUUID()
			}

			// Mock do Prisma para retornar null
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue({
							id: 'user-123',
							userProfileId: TestData.generateUUID(),
							email: 'test@example.com'
						})
					},
					follow: {
						findFirst: jest.fn().mockResolvedValue(null)
					}
				}
			})

			// Mock do UserRepository para retornar null (usuário não encontrado)
			const { UserRepository } = require('@shared/repositories/user.repository')
			jest.spyOn(UserRepository.prototype, 'findUserByProfileId').mockResolvedValue(null)

			// Act & Assert
			await expect(httpClient.post('/v1/follow/toggle', followData))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: 'TARGET_NOT_FOUND'
					}
				})
		})

		it('should return CANNOT_FOLLOW_SELF when trying to follow yourself', async () => {
			// Arrange
			const followingId = TestData.generateUUID()
			const authToken = TestTokens.generateValidToken({ userProfileId: followingId })
			httpClient.setAuthToken(authToken)
			const followData = {
				followingId
			}

			// Mock do Prisma para retornar erro de auto-follow
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockResolvedValue({
				id: 'user-123',
				userProfileId: followingId,
				email: 'test@example.com'
			})
			mockPrismaClient.follow.findFirst.mockResolvedValue(null)

			// Act & Assert
			await expect(httpClient.post('/v1/follow/toggle', followData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: 'CANNOT_FOLLOW_SELF'
					}
				})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)
			
			const followData = {
				followingId: TestData.generateUUID()
			}

			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue({
							id: 'user-123',
							userProfileId: TestData.generateUUID(),
							email: 'test@example.com'
						})
					},
					follow: {
						findFirst: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/v1/follow/toggle', followData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

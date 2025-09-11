import { IntegrationTestSetup } from '@test/setup/integration-test-setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Toggle Like Integration Tests', () => {
	let httpClient: HttpClient
	let baseUrl: string
	let authToken: string
	let ideaId: string

	beforeAll(async () => {
		// Inicia o servidor real
		baseUrl = await IntegrationTestSetup.startServer()
		httpClient = new HttpClient(baseUrl)
		
		// Cria um usuário e obtém token de autenticação
		const userData = TestData.createUser()
		IntegrationTestSetup.setupMocks({
			prisma: {
				user: {
					findUnique: jest.fn().mockResolvedValue(null),
					create: jest.fn().mockResolvedValue({
						id: TestData.generateUUID(),
						username: userData.username,
						email: userData.email,
						verified: true,
						created_at: new Date(),
						updated_at: new Date(),
						userProfileId: TestData.generateUUID(),
						loginAttempts: 0,
						blockedUntil: null,
						userProfile: {
							id: TestData.generateUUID(),
							name: null,
							bio: null,
							icon: null,
							created_at: new Date(),
							updated_at: new Date()
						}
					})
				}
			}
		})
		
		const signupResponse = await httpClient.post('/v1/auth/signup', userData)
		authToken = signupResponse.data.accessToken
		httpClient.setAuthToken(authToken)
		
		// Cria uma ideia para dar like
		const ideaData = TestData.createIdea()
		ideaId = TestData.generateUUID()
		IntegrationTestSetup.setupMocks({
			prisma: {
				idea: {
					create: jest.fn().mockResolvedValue({
						id: ideaId,
						title: ideaData.title,
						description: ideaData.description,
						authorId: TestData.generateUUID(),
						created_at: new Date(),
						updated_at: new Date(),
						author: {
							id: TestData.generateUUID(),
							username: 'testuser',
							email: 'test@example.com',
							userProfile: {
								id: TestData.generateUUID(),
								name: 'Test User',
								bio: null,
								icon: null
							}
						},
						images: [],
						tags: [],
						links: [],
						_count: {
							likes: 0,
							comments: 0,
							views: 0
						}
					})
				}
			}
		})
		
		await httpClient.post('/v1/ideas', ideaData)
	})

	afterAll(async () => {
		// Para o servidor
		await IntegrationTestSetup.stopServer()
	})

	beforeEach(() => {
		// Limpa mocks antes de cada teste
		IntegrationTestSetup.clearMocks()
	})

	describe('POST /v1/likes', () => {
		it('should create like successfully when not liked before', async () => {
			// Arrange
			const likeData = { ideaId }
			
			// Mock do Prisma para retornar sucesso
			IntegrationTestSetup.setupMocks({
				prisma: {
					like: {
						findFirst: jest.fn().mockResolvedValue(null), // Não tem like ainda
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
			const response = await httpClient.post('/v1/likes', likeData)

			// Assert
			expect(response.status).toBe(201)
			expect(response.data).toHaveProperty('id')
			expect(response.data.ideaId).toBe(likeData.ideaId)
			expect(response.data).toHaveProperty('created_at')
		})

		it('should remove like successfully when already liked', async () => {
			// Arrange
			const likeData = { ideaId }
			const existingLike = {
				id: TestData.generateUUID(),
				ideaId: likeData.ideaId,
				userId: TestData.generateUUID(),
				created_at: new Date()
			}
			
			// Mock do Prisma para retornar like existente e depois deletar
			IntegrationTestSetup.setupMocks({
				prisma: {
					like: {
						findFirst: jest.fn().mockResolvedValue(existingLike),
						delete: jest.fn().mockResolvedValue(existingLike)
					}
				}
			})

			// Act
			const response = await httpClient.post('/v1/likes', likeData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.message).toBe('Like removed successfully')
		})

		it('should return validation error for invalid ideaId', async () => {
			// Arrange
			const likeData = { ideaId: 'invalid-uuid' }

			// Act & Assert
			await expect(httpClient.post('/v1/likes', likeData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_IDEA_ID'
						}
					}
				})
		})

		it('should return UNAUTHORIZED when no token provided', async () => {
			// Arrange
			const likeData = { ideaId }
			const clientWithoutAuth = new HttpClient(baseUrl)

			// Act & Assert
			await expect(clientWithoutAuth.post('/v1/likes', likeData))
				.rejects.toMatchObject({
					response: {
						status: 401,
						data: {
							message: 'UNAUTHORIZED'
						}
					}
				})
		})

		it('should return IDEA_NOT_FOUND when idea does not exist', async () => {
			// Arrange
			const likeData = { ideaId: TestData.generateUUID() }
			
			// Mock do Prisma para retornar ideia não encontrada
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findUnique: jest.fn().mockResolvedValue(null)
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/v1/likes', likeData))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: {
							message: 'IDEA_NOT_FOUND'
						}
					}
				})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const likeData = { ideaId }
			
			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					like: {
						findFirst: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/v1/likes', likeData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})
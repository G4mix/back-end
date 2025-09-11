import { IntegrationTestSetup } from '@test/setup/integration-test-setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Create Comment Integration Tests', () => {
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
		
		// Cria uma ideia para comentar
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

	describe('POST /v1/comments', () => {
		it('should create comment successfully with valid data', async () => {
			// Arrange
			const commentData = TestData.createComment({ ideaId })
			
			// Mock do Prisma para retornar sucesso
			IntegrationTestSetup.setupMocks({
				prisma: {
					comment: {
						create: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							content: commentData.content,
							ideaId: commentData.ideaId,
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
							idea: {
								id: ideaId,
								title: 'Test Idea',
								description: 'Test Description'
							}
						})
					}
				}
			})

			// Act
			const response = await httpClient.post('/v1/comments', commentData)

			// Assert
			expect(response.status).toBe(201)
			expect(response.data).toHaveProperty('id')
			expect(response.data.content).toBe(commentData.content)
			expect(response.data.ideaId).toBe(commentData.ideaId)
			expect(response.data).toHaveProperty('author')
			expect(response.data).toHaveProperty('created_at')
		})

		it('should return validation error for empty content', async () => {
			// Arrange
			const commentData = TestData.createComment({ ideaId, content: '' })

			// Act & Assert
			await expect(httpClient.post('/v1/comments', commentData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_CONTENT'
						}
					}
				})
		})

		it('should return validation error for invalid ideaId', async () => {
			// Arrange
			const commentData = TestData.createComment({ ideaId: 'invalid-uuid' })

			// Act & Assert
			await expect(httpClient.post('/v1/comments', commentData))
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
			const commentData = TestData.createComment({ ideaId })
			const clientWithoutAuth = new HttpClient(baseUrl)

			// Act & Assert
			await expect(clientWithoutAuth.post('/v1/comments', commentData))
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
			const commentData = TestData.createComment({ ideaId: TestData.generateUUID() })
			
			// Mock do Prisma para retornar ideia não encontrada
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findUnique: jest.fn().mockResolvedValue(null)
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/v1/comments', commentData))
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
			const commentData = TestData.createComment({ ideaId })
			
			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					comment: {
						create: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/v1/comments', commentData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

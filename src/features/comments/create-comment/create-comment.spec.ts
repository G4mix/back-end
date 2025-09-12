import { IntegrationTestSetup } from '@test/jest.setup'
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
		const userDataInput = TestData.createUser()
		const userId = TestData.generateUUID()
		const userProfileId = TestData.generateUUID()
		const userData = {
			id: userId,
			username: userDataInput.username,
			email: userDataInput.email,
			verified: true,
			created_at: new Date(),
			updated_at: new Date(),
			userProfileId: userProfileId,
			loginAttempts: 0,
			blockedUntil: null,
			userProfile: {
				id: userProfileId,
				name: null,
				bio: null,
				icon: null,
				created_at: new Date(),
				updated_at: new Date()
			}
		}

		IntegrationTestSetup.setupMocks({
			prisma: {
				user: {
					findUnique: jest.fn().mockImplementation(({ where }) => {
						if (where.id === userId) {
							return Promise.resolve(userData)
						}
						return Promise.resolve(null)
					}),
					create: jest.fn().mockResolvedValue(userData)
				}
			}
		})
		
		const signupResponse = await httpClient.post('/v1/auth/signup', userDataInput)
		authToken = signupResponse.data.accessToken
		httpClient.setAuthToken(authToken)
		
		// Cria uma ideia para comentar
		const ideaData = TestData.createIdea()
		ideaId = TestData.generateUUID()
		const ideaResponse = {
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
		}
		
		IntegrationTestSetup.setupMocks({
			prisma: {
				idea: {
					create: jest.fn().mockResolvedValue(ideaResponse),
					findUnique: jest.fn().mockImplementation(({ where }) => {
						if (where.id === ideaId) {
							return Promise.resolve(ideaResponse)
						}
						return Promise.resolve(null)
					})
				},
				comment: {
					create: jest.fn().mockImplementation(({ data, include }) => {
						console.log('Mock prisma.comment.create chamado com:', { data, include })
						const result = {
							id: TestData.generateUUID(),
							content: data.content,
							ideaId: data.ideaId,
							parentCommentId: data.parentCommentId,
							authorId: data.authorId,
							created_at: new Date(),
							updated_at: new Date(),
							author: {
								id: TestData.generateUUID(),
								displayName: 'Test User',
								icon: null,
								user: {
									id: TestData.generateUUID(),
									username: 'testuser',
									email: 'test@example.com'
								},
								links: []
							},
							_count: {
								likes: 0,
								replies: 0
							}
						}
						console.log('Mock prisma.comment.create retornando:', result)
						return Promise.resolve(result)
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
			

			// Act
			const response = await httpClient.post('/v1/comment/', commentData)

			// Assert
			expect(response.status).toBe(201)
			expect(response.data.comment).toHaveProperty('id')
			expect(response.data.comment.content).toBe(commentData.content)
			expect(response.data.comment.ideaId).toBe(commentData.ideaId)
			expect(response.data.comment).toHaveProperty('author')
			expect(response.data.comment).toHaveProperty('created_at')
		})

		it('should return validation error for empty content', async () => {
			// Arrange
			const commentData = TestData.createComment({ ideaId, content: '' })

			// Act & Assert
					await expect(httpClient.post('/v1/comment/', commentData))
							.rejects.toMatchObject({
								response: {
									status: 400,
									data: {
										message: 'CONTENT_REQUIRED'
									}
								}
							})
		})

		it('should return validation error for invalid ideaId', async () => {
			// Arrange
			const commentData = TestData.createComment({ ideaId: 'invalid-uuid' })

			// Act & Assert
			await expect(httpClient.post('/v1/comment/', commentData))
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
			await expect(clientWithoutAuth.post('/v1/comment/', commentData))
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
					await expect(httpClient.post('/v1/comment/', commentData))
							.rejects.toMatchObject({
								response: {
									status: 404,
									data: 'IDEA_NOT_FOUND'
								}
							})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const commentData = TestData.createComment({ ideaId })
			
			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findUnique: jest.fn().mockImplementation(({ where }) => {
							if (where.id === ideaId) {
								return Promise.resolve({
									id: ideaId,
									title: 'Test Idea',
									description: 'Test Description',
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
							return Promise.resolve(null)
						})
					},
					comment: {
						create: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/v1/comment/', commentData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

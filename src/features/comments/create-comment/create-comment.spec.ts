import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'
import { container } from 'tsyringe'

describe('Create Comment Integration Tests', () => {
	let httpClient: HttpClient
	let baseUrl: string
	let authToken: string
	let ideaId: string

	beforeAll(async () => {
		// Inicia o servidor real
		baseUrl = await IntegrationTestSetup.startServer()
		httpClient = new HttpClient(baseUrl)
		
		// Configura dados de teste sem fazer requisições reais
		ideaId = TestData.generateUUID()
		
		// Gera um token válido usando o helper de testes
		const { TestTokens } = await import('@test/helpers/test-tokens')
		authToken = TestTokens.generateValidToken({ 
			sub: '123e4567-e89b-12d3-a456-426614174000', // ID fixo que será usado no mock
			userProfileId: TestData.generateUUID()
		})
		httpClient.setAuthToken(authToken)
	})

	afterAll(async () => {
		// Para o servidor
		await IntegrationTestSetup.stopServer()
	})

	beforeEach(() => {
		// Limpa mocks antes de cada teste
		IntegrationTestSetup.clearMocks()
		
		// Configura mocks padrão para o usuário em todos os testes
		const mockPrismaClient = container.resolve('PostgresqlClient') as any
		const userId = '123e4567-e89b-12d3-a456-426614174000' // ID fixo que está no token
		const userProfileId = TestData.generateUUID()
		const userData = {
			id: userId,
			username: 'testuser',
			email: 'test@example.com',
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
		
		// Mock para encontrar usuário pelo ID (usado pelo middleware de segurança)
		mockPrismaClient.user.findUnique.mockImplementation(({ where }: { where: { id: string } }) => {
			if (where.id === userId) {
				return Promise.resolve(userData)
			}
			return Promise.resolve(null)
		})
		
		// Mock padrão para ideias
		mockPrismaClient.idea.findUnique.mockResolvedValue({
			id: ideaId,
			title: 'Test Idea',
			description: 'Test Description',
			authorId: userId,
			created_at: new Date(),
			updated_at: new Date()
		})
		
		// Mock padrão para comentários
		mockPrismaClient.comment.create.mockResolvedValue({
			id: TestData.generateUUID(),
			content: 'Test comment',
			ideaId: ideaId,
			authorId: userId,
			created_at: new Date(),
			updated_at: new Date(),
			author: {
				id: TestData.generateUUID(),
				displayName: 'Test User',
				icon: null,
				user: {
					id: userId,
					username: 'testuser',
					email: 'test@example.com'
				},
				links: []
			},
			_count: {
				likes: 0,
				replies: 0
			}
		})
	})

	describe('POST /v1/comment', () => {
		it('should create comment successfully with valid data', async () => {
			// Arrange
			const commentData = TestData.createComment({ ideaId })
			
			// Mock do Prisma - aplica após o reset do beforeEach
			const mockPrismaClient = require('tsyringe').container.resolve('PostgresqlClient')
			const userId = TestData.generateUUID()
			const userProfileId = TestData.generateUUID()
			const userData = {
				id: userId,
				username: 'testuser',
				email: 'test@example.com',
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
			
			mockPrismaClient.user.findUnique.mockResolvedValue(userData)
			mockPrismaClient.idea.findUnique.mockResolvedValue({
				id: ideaId,
				title: 'Test Idea',
				description: 'Test Description',
				authorId: userId,
				created_at: new Date(),
				updated_at: new Date()
			})
			mockPrismaClient.comment.create.mockResolvedValue({
				id: TestData.generateUUID(),
				content: commentData.content,
				ideaId: commentData.ideaId,
				authorId: userId,
				created_at: new Date(),
				updated_at: new Date(),
				author: {
					id: TestData.generateUUID(),
					displayName: 'Test User',
					icon: null,
					user: {
						id: userId,
						username: 'testuser',
						email: 'test@example.com'
					},
					links: []
				},
				_count: {
					likes: 0,
					replies: 0
				}
			})

			// Act
			const response = await httpClient.post('/v1/comment', commentData)

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
					await expect(httpClient.post('/v1/comment', commentData))
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
			await expect(httpClient.post('/v1/comment', commentData))
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
			await expect(clientWithoutAuth.post('/v1/comment', commentData))
				.rejects.toMatchObject({
					response: {
						status: 401,
						data: {
							message: 'UNAUTHORIZED'
						}
					}
				})
		})

		it('should return UNAUTHORIZED when userProfileId is missing', async () => {
			// Arrange
			const commentData = TestData.createComment({ ideaId })
			
			// Mock do Prisma - aplica após o reset do beforeEach
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			const userId = TestData.generateUUID()
			const userData = {
				id: userId,
				username: 'testuser',
				email: 'test@example.com',
				verified: true,
				created_at: new Date(),
				updated_at: new Date(),
				userProfileId: null, // Sem userProfileId
				loginAttempts: 0,
				blockedUntil: null,
				userProfile: {
					id: null,
					name: null,
					bio: null,
					icon: null,
					created_at: new Date(),
					updated_at: new Date()
				}
			}
			
			// Mock para retornar usuário sem userProfileId quando o middleware buscar
			mockPrismaClient.user.findUnique.mockImplementation(({ where }: { where: { id: string } }) => {
				if (where.id === userId) {
					return Promise.resolve(userData)
				}
				return Promise.resolve(null)
			})

			// Mock do JWT para retornar claims sem userProfileId
			const jwtManager = require('@shared/utils/jwt-manager')
			const originalDecode = jwtManager.JwtManager.decode
			jwtManager.JwtManager.decode = jest.fn().mockReturnValue({
				sub: userId,
				userProfileId: null, // Sem userProfileId nos claims
				iat: Date.now(),
				exp: Date.now() + 86400
			})

			// Act & Assert
			await expect(httpClient.post('/v1/comment', commentData))
				.rejects.toMatchObject({
					response: {
						status: 401,
						data: {
							message: 'UNAUTHORIZED'
						}
					}
				})

			// Restore original function
			jwtManager.JwtManager.decode = originalDecode
		})

		it('should return IDEA_NOT_FOUND when idea does not exist', async () => {
			// Arrange
			const commentData = TestData.createComment({ ideaId: TestData.generateUUID() })
			
			// Mock do Prisma - aplica após o reset do beforeEach
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			const userData = TestData.createUser()
			mockPrismaClient.user.findUnique.mockResolvedValue(userData)
			mockPrismaClient.idea.findUnique.mockResolvedValue(null) // Ideia não encontrada

			// Act & Assert
			await expect(httpClient.post('/v1/comment', commentData))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: { message: 'NOT_FOUNDED_DATA' }
					}
				})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const commentData = TestData.createComment({ ideaId })
			
			// Mock do Prisma - aplica após o reset do beforeEach
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			const userData = TestData.createUser()
			mockPrismaClient.user.findUnique.mockResolvedValue(userData)
			mockPrismaClient.idea.findUnique.mockResolvedValue({
				id: ideaId,
				title: 'Test Idea',
				description: 'Test Description',
				authorId: TestData.generateUUID(),
				created_at: new Date(),
				updated_at: new Date()
			})
			mockPrismaClient.comment.create.mockRejectedValue(new Error('Database connection failed'))

			// Act & Assert
			await expect(httpClient.post('/v1/comment', commentData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})

		it('should create reply comment successfully when parent comment exists', async () => {
			// Arrange
			const parentCommentId = TestData.generateUUID()
			const commentData = TestData.createComment({ 
				ideaId, 
				parentCommentId 
			})
			
			// Mock do Prisma - aplica após o reset do beforeEach
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			const userId = TestData.generateUUID()
			const userProfileId = TestData.generateUUID()
			const userData = {
				id: userId,
				username: 'testuser',
				email: 'test@example.com',
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
			
			const parentComment = {
				id: parentCommentId,
				content: 'Parent comment',
				ideaId: ideaId,
				authorId: TestData.generateUUID(),
				created_at: new Date(),
				updated_at: new Date()
			}
			
			mockPrismaClient.user.findUnique.mockResolvedValue(userData)
			mockPrismaClient.idea.findUnique.mockResolvedValue({
				id: ideaId,
				title: 'Test Idea',
				description: 'Test Description',
				authorId: userId,
				created_at: new Date(),
				updated_at: new Date()
			})
			mockPrismaClient.comment.findUnique.mockImplementation(({ where }: { where: { id: string } }) => {
				if (where.id === parentCommentId) {
					return Promise.resolve(parentComment)
				}
				return Promise.resolve(null)
			})
			mockPrismaClient.comment.create.mockResolvedValue({
				id: TestData.generateUUID(),
				content: commentData.content,
				ideaId: commentData.ideaId,
				parentCommentId: commentData.parentCommentId,
				authorId: userId,
				created_at: new Date(),
				updated_at: new Date(),
				author: {
					id: TestData.generateUUID(),
					displayName: 'Test User',
					icon: null,
					user: {
						id: userId,
						username: 'testuser',
						email: 'test@example.com'
					},
					links: []
				},
				_count: {
					likes: 0,
					replies: 0
				}
			})

			// Act
			const response = await httpClient.post('/v1/comment', commentData)

			// Assert
			expect(response.status).toBe(201)
			expect(response.data.comment).toHaveProperty('id')
			expect(response.data.comment.content).toBe(commentData.content)
			expect(response.data.comment.ideaId).toBe(commentData.ideaId)
			expect(response.data.comment.parentCommentId).toBe(parentCommentId)
			expect(response.data.comment).toHaveProperty('author')
			expect(response.data.comment).toHaveProperty('created_at')
		})

		it('should return COMMENT_NOT_FOUND when parent comment does not exist', async () => {
			// Arrange
			const parentCommentId = TestData.generateUUID()
			const commentData = TestData.createComment({ 
				ideaId, 
				parentCommentId 
			})
			
			// Mock do Prisma - aplica após o reset do beforeEach
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			const userId = TestData.generateUUID()
			const userProfileId = TestData.generateUUID()
			const userData = {
				id: userId,
				username: 'testuser',
				email: 'test@example.com',
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
			
			mockPrismaClient.user.findUnique.mockResolvedValue(userData)
			mockPrismaClient.idea.findUnique.mockResolvedValue({
				id: ideaId,
				title: 'Test Idea',
				description: 'Test Description',
				authorId: userId,
				created_at: new Date(),
				updated_at: new Date()
			})
			mockPrismaClient.comment.findUnique.mockImplementation(({ where }: { where: { id: string } }) => {
				if (where.id === parentCommentId) {
					return Promise.resolve(null) // Parent comment não encontrado
				}
				return Promise.resolve(null)
			})

			// Act & Assert
			await expect(httpClient.post('/v1/comment', commentData))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: { message: 'NOT_FOUNDED_DATA' }
					}
				})
		})

		it('should handle database error during parent comment validation', async () => {
			// Arrange
			const parentCommentId = TestData.generateUUID()
			const commentData = TestData.createComment({ 
				ideaId, 
				parentCommentId 
			})
			
			// Mock do Prisma - aplica após o reset do beforeEach
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			const userId = TestData.generateUUID()
			const userProfileId = TestData.generateUUID()
			const userData = {
				id: userId,
				username: 'testuser',
				email: 'test@example.com',
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
			
			mockPrismaClient.user.findUnique.mockResolvedValue(userData)
			mockPrismaClient.idea.findUnique.mockResolvedValue({
				id: ideaId,
				title: 'Test Idea',
				description: 'Test Description',
				authorId: userId,
				created_at: new Date(),
				updated_at: new Date()
			})
			mockPrismaClient.comment.findUnique.mockImplementation(({ where }: { where: { id: string } }) => {
				if (where.id === parentCommentId) {
					return Promise.reject(new Error('Database connection failed'))
				}
				return Promise.resolve(null)
			})

			// Act & Assert
			await expect(httpClient.post('/v1/comment', commentData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})

		it('should handle database error during idea validation', async () => {
			// Arrange
			const commentData = TestData.createComment({ ideaId })
			
			// Mock do Prisma - aplica após o reset do beforeEach
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			const userId = TestData.generateUUID()
			const userProfileId = TestData.generateUUID()
			const userData = {
				id: userId,
				username: 'testuser',
				email: 'test@example.com',
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
			
			mockPrismaClient.user.findUnique.mockResolvedValue(userData)
			mockPrismaClient.idea.findUnique.mockRejectedValue(new Error('Database connection failed'))

			// Act & Assert
			await expect(httpClient.post('/v1/comment', commentData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})

		it('should handle non-Error exception in catch block', async () => {
			// Arrange
			const commentData = TestData.createComment({ ideaId })
			
			// Mock do Prisma - aplica após o reset do beforeEach
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			const userId = TestData.generateUUID()
			const userProfileId = TestData.generateUUID()
			const userData = {
				id: userId,
				username: 'testuser',
				email: 'test@example.com',
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
			
			mockPrismaClient.user.findUnique.mockResolvedValue(userData)
			mockPrismaClient.idea.findUnique.mockRejectedValue('String error instead of Error object')

			// Act & Assert
			await expect(httpClient.post('/v1/comment', commentData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})


		it('should use body when getInputDTO is not available', async () => {
			// Arrange
			const commentData = TestData.createComment({ ideaId })
			
			// Mock do Prisma - aplica após o reset do beforeEach
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			const userId = TestData.generateUUID()
			const userProfileId = TestData.generateUUID()
			const userData = {
				id: userId,
				username: 'testuser',
				email: 'test@example.com',
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
			
			mockPrismaClient.user.findUnique.mockResolvedValue(userData)
			mockPrismaClient.idea.findUnique.mockResolvedValue({
				id: ideaId,
				title: 'Test Idea',
				description: 'Test Description',
				authorId: userId,
				created_at: new Date(),
				updated_at: new Date()
			})
			mockPrismaClient.comment.create.mockResolvedValue({
				id: TestData.generateUUID(),
				content: commentData.content,
				ideaId: commentData.ideaId,
				authorId: userId,
				created_at: new Date(),
				updated_at: new Date(),
				author: {
					id: TestData.generateUUID(),
					displayName: 'Test User',
					icon: null,
					user: {
						id: userId,
						username: 'testuser',
						email: 'test@example.com'
					},
					links: []
				},
				_count: {
					likes: 0,
					replies: 0
				}
			})

			// Mock do JWT para retornar claims sem getInputDTO
			const jwtManager = require('@shared/utils/jwt-manager')
			const originalDecode = jwtManager.JwtManager.decode
			jwtManager.JwtManager.decode = jest.fn().mockReturnValue({
				sub: userId,
				userProfileId: userProfileId,
				iat: Date.now(),
				exp: Date.now() + 86400
			})

			// Act
			const response = await httpClient.post('/v1/comment', commentData)

			// Assert
			expect(response.status).toBe(201)
			expect(response.data.comment).toHaveProperty('id')
			expect(response.data.comment.content).toBe(commentData.content)
			expect(response.data.comment.ideaId).toBe(commentData.ideaId)
			expect(response.data.comment).toHaveProperty('author')
			expect(response.data.comment).toHaveProperty('created_at')

			// Restore original function
			jwtManager.JwtManager.decode = originalDecode
		})

		it('should handle undefined request.user in catch block', async () => {
			// Arrange
			const commentData = TestData.createComment({ ideaId })
			
			// Mock do Prisma - aplica após o reset do beforeEach
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			const userId = TestData.generateUUID()
			const userProfileId = TestData.generateUUID()
			const userData = {
				id: userId,
				username: 'testuser',
				email: 'test@example.com',
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
			
			mockPrismaClient.user.findUnique.mockResolvedValue(userData)
			mockPrismaClient.idea.findUnique.mockRejectedValue(new Error('Database connection failed'))

			// Mock do JWT para retornar claims válidos primeiro, depois undefined no catch (linha 175)
			const jwtManager = require('@shared/utils/jwt-manager')
			const originalDecode = jwtManager.JwtManager.decode
			jwtManager.JwtManager.decode = jest.fn().mockReturnValue({
				sub: userId,
				userProfileId: userProfileId, // Válido para passar da validação inicial
				iat: Date.now(),
				exp: Date.now() + 86400
			})

			// Act & Assert
			await expect(httpClient.post('/v1/comment', commentData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})

			// Restore original function
			jwtManager.JwtManager.decode = originalDecode
		})

		it('should handle undefined request.user in main flow', async () => {
			// Arrange
			const commentData = TestData.createComment({ ideaId })
			
			// Mock do Prisma - aplica após o reset do beforeEach
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			const userId = TestData.generateUUID()
			const userProfileId = TestData.generateUUID()
			const userData = {
				id: userId,
				username: 'testuser',
				email: 'test@example.com',
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
			
			// Mock para retornar usuário válido
			mockPrismaClient.user.findUnique.mockResolvedValue(userData)
			
			// Mock do JWT para retornar claims com user undefined (linha 106)
			const jwtManager = require('@shared/utils/jwt-manager')
			const originalDecode = jwtManager.JwtManager.decode
			jwtManager.JwtManager.decode = jest.fn().mockReturnValue({
				sub: userId,
				userProfileId: null, // undefined userProfileId
				iat: Date.now(),
				exp: Date.now() + 86400
			})

			// Act & Assert
			await expect(httpClient.post('/v1/comment', commentData))
				.rejects.toMatchObject({
					response: {
						status: 401,
						data: {
							message: 'UNAUTHORIZED'
						}
					}
				})

			// Restore original function
			jwtManager.JwtManager.decode = originalDecode
		})

	})
})

import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'
import { container } from 'tsyringe'

describe('Get Comments Integration Tests', () => {
	let httpClient: HttpClient
	let baseUrl: string
	let authToken: string
	let ideaId: string
	let userProfileId: string

	beforeAll(async () => {
		// Inicia o servidor real
		baseUrl = await IntegrationTestSetup.startServer()
		httpClient = new HttpClient(baseUrl)
		
		// Configura dados de teste sem fazer requisições reais
		userProfileId = TestData.generateUUID()
		ideaId = TestData.generateUUID()
		const userId = TestData.generateUUID() // ID do usuário que será usado no token
		
		// Gera um token válido usando o helper de testes
		const { TestTokens } = await import('@test/helpers/test-tokens')
		authToken = TestTokens.generateValidToken({ 
			sub: userId, // ID do usuário no token
			userProfileId 
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
		
		// Mock padrão para comentários
		mockPrismaClient.comment.findMany.mockResolvedValue([])
		mockPrismaClient.comment.count.mockResolvedValue(0)
	})

	describe('GET /v1/comment', () => {
		it('should get comments successfully with default pagination', async () => {
			// Arrange
			const mockComments = [
				{
					id: TestData.generateUUID(),
					content: 'First comment',
					ideaId: ideaId,
					parentCommentId: null,
					authorId: userProfileId,
					created_at: new Date('2023-10-27T10:00:00Z'),
					updated_at: new Date('2023-10-27T10:00:00Z'),
					author: {
						id: userProfileId,
						displayName: 'Test User',
						icon: 'https://example.com/icon.jpg'
					},
					_count: {
						likes: 5,
						replies: 2
					}
				},
				{
					id: TestData.generateUUID(),
					content: 'Second comment',
					ideaId: ideaId,
					parentCommentId: null,
					authorId: userProfileId,
					created_at: new Date('2023-10-27T11:00:00Z'),
					updated_at: new Date('2023-10-27T11:00:00Z'),
					author: {
						id: userProfileId,
						displayName: 'Test User',
						icon: 'https://example.com/icon.jpg'
					},
					_count: {
						likes: 3,
						replies: 1
					}
				}
			]

			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			mockPrismaClient.comment.findMany.mockResolvedValue(mockComments)
			mockPrismaClient.comment.count.mockResolvedValue(25)

			// Act
			const response = await httpClient.get('/v1/comment', { ideaId })

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.comments).toHaveLength(2)
			expect(response.data.comments[0].content).toBe('First comment')
			expect(response.data.comments[0].author.displayName).toBe('Test User')
			expect(response.data.comments[0].created_at).toBe('2023-10-27T10:00:00.000Z')
			expect(response.data.pagination.page).toBe(0)
			expect(response.data.pagination.limit).toBe(10)
			expect(response.data.pagination.total).toBe(25)
			expect(response.data.pagination.totalPages).toBe(3)
			expect(response.data.pagination.hasNext).toBe(true)
			expect(response.data.pagination.hasPrev).toBe(false)
		})

		it('should get comments successfully with custom pagination', async () => {
			// Arrange
			const mockComments = [
				{
					id: TestData.generateUUID(),
					content: 'Custom page comment',
					ideaId: ideaId,
					parentCommentId: null,
					authorId: userProfileId,
					created_at: new Date('2023-10-27T10:00:00Z'),
					updated_at: new Date('2023-10-27T10:00:00Z'),
					author: {
						id: userProfileId,
						displayName: 'Test User',
						icon: 'https://example.com/icon.jpg'
					},
					_count: {
						likes: 2,
						replies: 0
					}
				}
			]

			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			mockPrismaClient.comment.findMany.mockResolvedValue(mockComments)
			mockPrismaClient.comment.count.mockResolvedValue(15)

			// Act
			const response = await httpClient.get('/v1/comment', { 
				ideaId, 
				page: 1, 
				limit: 5 
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.comments).toHaveLength(1)
			expect(response.data.comments[0].content).toBe('Custom page comment')
			expect(response.data.pagination.page).toBe(1)
			expect(response.data.pagination.limit).toBe(5)
			expect(response.data.pagination.total).toBe(15)
			expect(response.data.pagination.totalPages).toBe(3)
			expect(response.data.pagination.hasNext).toBe(true)
			expect(response.data.pagination.hasPrev).toBe(true)
		})

		it('should get comments successfully with parentCommentId filter', async () => {
			// Arrange
			const parentCommentId = TestData.generateUUID()
			const mockComments = [
				{
					id: TestData.generateUUID(),
					content: 'Reply to parent comment',
					ideaId: ideaId,
					parentCommentId: parentCommentId,
					authorId: userProfileId,
					created_at: new Date('2023-10-27T10:00:00Z'),
					updated_at: new Date('2023-10-27T10:00:00Z'),
					author: {
						id: userProfileId,
						displayName: 'Test User',
						icon: 'https://example.com/icon.jpg'
					},
					_count: {
						likes: 1,
						replies: 0
					}
				}
			]

			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			mockPrismaClient.comment.findMany.mockResolvedValue(mockComments)
			mockPrismaClient.comment.count.mockResolvedValue(1)

			// Act
			const response = await httpClient.get('/v1/comment', { 
				ideaId, 
				parentCommentId 
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.comments).toHaveLength(1)
			expect(response.data.comments[0].content).toBe('Reply to parent comment')
			expect(response.data.comments[0].parentCommentId).toBe(parentCommentId)
			expect(response.data.pagination.total).toBe(1)
		})

		it('should return empty comments array when no comments found', async () => {
			// Arrange
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			mockPrismaClient.comment.findMany.mockResolvedValue([])
			mockPrismaClient.comment.count.mockResolvedValue(0)

			// Act
			const response = await httpClient.get('/v1/comment', { ideaId })

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.comments).toHaveLength(0)
			expect(response.data.pagination.total).toBe(0)
			expect(response.data.pagination.totalPages).toBe(0)
			expect(response.data.pagination.hasNext).toBe(false)
			expect(response.data.pagination.hasPrev).toBe(false)
		})

		it('should handle pagination edge case - last page', async () => {
			// Arrange
			const mockComments = [
				{
					id: TestData.generateUUID(),
					content: 'Last page comment',
					ideaId: ideaId,
					parentCommentId: null,
					authorId: userProfileId,
					created_at: new Date('2023-10-27T10:00:00Z'),
					updated_at: new Date('2023-10-27T10:00:00Z'),
					author: {
						id: userProfileId,
						displayName: 'Test User',
						icon: 'https://example.com/icon.jpg'
					},
					_count: {
						likes: 1,
						replies: 0
					}
				}
			]

			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			mockPrismaClient.comment.findMany.mockResolvedValue(mockComments)
			mockPrismaClient.comment.count.mockResolvedValue(21)

			// Act
			const response = await httpClient.get('/v1/comment', { 
				ideaId, 
				page: 2, 
				limit: 10 
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.comments).toHaveLength(1)
			expect(response.data.pagination.page).toBe(2)
			expect(response.data.pagination.totalPages).toBe(3)
			expect(response.data.pagination.hasNext).toBe(false)
			expect(response.data.pagination.hasPrev).toBe(true)
		})

		it('should handle pagination edge case - first page', async () => {
			// Arrange
			const mockComments = [
				{
					id: TestData.generateUUID(),
					content: 'First page comment',
					ideaId: ideaId,
					parentCommentId: null,
					authorId: userProfileId,
					created_at: new Date('2023-10-27T10:00:00Z'),
					updated_at: new Date('2023-10-27T10:00:00Z'),
					author: {
						id: userProfileId,
						displayName: 'Test User',
						icon: 'https://example.com/icon.jpg'
					},
					_count: {
						likes: 1,
						replies: 0
					}
				}
			]

			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			mockPrismaClient.comment.findMany.mockResolvedValue(mockComments)
			mockPrismaClient.comment.count.mockResolvedValue(5)

			// Act
			const response = await httpClient.get('/v1/comment', { 
				ideaId, 
				page: 0, 
				limit: 10 
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.comments).toHaveLength(1)
			expect(response.data.pagination.page).toBe(0)
			expect(response.data.pagination.totalPages).toBe(1)
			expect(response.data.pagination.hasNext).toBe(false)
			expect(response.data.pagination.hasPrev).toBe(false)
		})

		it('should return UNAUTHORIZED when no token provided', async () => {
			// Arrange
			const clientWithoutAuth = new HttpClient(baseUrl)

			// Act & Assert
			await expect(clientWithoutAuth.get('/v1/comment/', { ideaId }))
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
			await expect(httpClient.get('/v1/comment', { ideaId }))
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

		it('should return validation error for invalid ideaId', async () => {
			// Act & Assert
			await expect(httpClient.get('/v1/comment', { ideaId: 'invalid-uuid' }))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_IDEA_ID'
						}
					}
				})
		})

		it('should return validation error for invalid page number', async () => {
			// Act & Assert
			await expect(httpClient.get('/v1/comment', { 
				ideaId, 
				page: -1 
			}))
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
			// Act & Assert
			await expect(httpClient.get('/v1/comment', { 
				ideaId, 
				limit: 0 
			}))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_LIMIT'
						}
					}
				})
		})

		it('should return validation error for limit too large', async () => {
			// Act & Assert
			await expect(httpClient.get('/v1/comment', { 
				ideaId, 
				limit: 101 
			}))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'LIMIT_TOO_LARGE'
						}
					}
				})
		})

		it('should return validation error for invalid parentCommentId', async () => {
			// Act & Assert
			await expect(httpClient.get('/v1/comment', { 
				ideaId, 
				parentCommentId: 'invalid-uuid' 
			}))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_PARENT_COMMENT_ID'
						}
					}
				})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			mockPrismaClient.comment.findMany.mockRejectedValue(new Error('Database connection failed'))

			// Act & Assert
			await expect(httpClient.get('/v1/comment', { ideaId }))
				.rejects.toMatchObject({
					response: {
						status: 500,
						data: {
							message: 'ERROR_WHILE_CHECKING_EMAIL'
						}
					}
				})
		})

		it('should handle non-Error exception in catch block', async () => {
			// Arrange
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			mockPrismaClient.comment.findMany.mockRejectedValue('String error instead of Error object')

			// Act & Assert
			await expect(httpClient.get('/v1/comment', { ideaId }))
				.rejects.toMatchObject({
					response: {
						status: 500,
						data: {
							message: 'ERROR_WHILE_CHECKING_EMAIL'
						}
					}
				})
		})

		it('should handle undefined request.user in catch block', async () => {
			// Arrange
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			mockPrismaClient.comment.findMany.mockRejectedValue(new Error('Database connection failed'))

			// Mock do JWT para retornar claims válidos primeiro, depois undefined no catch
			const jwtManager = require('@shared/utils/jwt-manager')
			const originalDecode = jwtManager.JwtManager.decode
			jwtManager.JwtManager.decode = jest.fn().mockReturnValue({
				sub: TestData.generateUUID(),
				userProfileId: userProfileId, // Válido para passar da validação inicial
				iat: Date.now(),
				exp: Date.now() + 86400
			})

			// Act & Assert
			await expect(httpClient.get('/v1/comment', { ideaId }))
				.rejects.toMatchObject({
					response: {
						status: 500,
						data: {
							message: 'ERROR_WHILE_CHECKING_EMAIL'
						}
					}
				})

			// Restore original function
			jwtManager.JwtManager.decode = originalDecode
		})

		it('should handle comments with null author icon', async () => {
			// Arrange
			const mockComments = [
				{
					id: TestData.generateUUID(),
					content: 'Comment with null icon',
					ideaId: ideaId,
					parentCommentId: null,
					authorId: userProfileId,
					created_at: new Date('2023-10-27T10:00:00Z'),
					updated_at: new Date('2023-10-27T10:00:00Z'),
					author: {
						id: userProfileId,
						displayName: 'Test User',
						icon: null // Icon null
					},
					_count: {
						likes: 1,
						replies: 0
					}
				}
			]

			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			mockPrismaClient.comment.findMany.mockResolvedValue(mockComments)
			mockPrismaClient.comment.count.mockResolvedValue(1)

			// Act
			const response = await httpClient.get('/v1/comment', { ideaId })

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.comments).toHaveLength(1)
			expect(response.data.comments[0].author.icon).toBe(null)
		})

		it('should handle comments with null author displayName', async () => {
			// Arrange
			const mockComments = [
				{
					id: TestData.generateUUID(),
					content: 'Comment with null displayName',
					ideaId: ideaId,
					parentCommentId: null,
					authorId: userProfileId,
					created_at: new Date('2023-10-27T10:00:00Z'),
					updated_at: new Date('2023-10-27T10:00:00Z'),
					author: {
						id: userProfileId,
						displayName: null, // DisplayName null
						icon: 'https://example.com/icon.jpg'
					},
					_count: {
						likes: 1,
						replies: 0
					}
				}
			]

			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			mockPrismaClient.comment.findMany.mockResolvedValue(mockComments)
			mockPrismaClient.comment.count.mockResolvedValue(1)

			// Act
			const response = await httpClient.get('/v1/comment', { ideaId })

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.comments).toHaveLength(1)
			expect(response.data.comments[0].author.displayName).toBe(null)
		})

		it('should handle comments without _count property', async () => {
			// Arrange
			const mockComments = [
				{
					id: TestData.generateUUID(),
					content: 'Comment without _count',
					ideaId: ideaId,
					parentCommentId: null,
					authorId: userProfileId,
					created_at: new Date('2023-10-27T10:00:00Z'),
					updated_at: new Date('2023-10-27T10:00:00Z'),
					author: {
						id: userProfileId,
						displayName: 'Test User',
						icon: 'https://example.com/icon.jpg'
					}
					// Sem _count
				}
			]

			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			mockPrismaClient.comment.findMany.mockResolvedValue(mockComments)
			mockPrismaClient.comment.count.mockResolvedValue(1)

			// Act
			const response = await httpClient.get('/v1/comment', { ideaId })

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.comments).toHaveLength(1)
			expect(response.data.comments[0].content).toBe('Comment without _count')
			// _count não está presente quando é undefined (omitido na serialização)
			expect(response.data.comments[0]).not.toHaveProperty('_count')
		})

		it('should handle comments with null parentCommentId', async () => {
			// Arrange
			const mockComments = [
				{
					id: TestData.generateUUID(),
					content: 'Comment with null parent',
					ideaId: ideaId,
					parentCommentId: null,
					authorId: userProfileId,
					created_at: new Date('2023-10-27T10:00:00Z'),
					updated_at: new Date('2023-10-27T10:00:00Z'),
					author: {
						id: userProfileId,
						displayName: 'Test User',
						icon: 'https://example.com/icon.jpg'
					},
					_count: {
						likes: 1,
						replies: 0
					}
				}
			]

			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			mockPrismaClient.comment.findMany.mockResolvedValue(mockComments)
			mockPrismaClient.comment.count.mockResolvedValue(1)

			// Act
			const response = await httpClient.get('/v1/comment', { ideaId })

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.comments).toHaveLength(1)
			expect(response.data.comments[0].parentCommentId).toBe(null)
		})

		it('should handle pagination with exact division', async () => {
			// Arrange
			const mockComments = [
				{
					id: TestData.generateUUID(),
					content: 'Exact division comment',
					ideaId: ideaId,
					parentCommentId: null,
					authorId: userProfileId,
					created_at: new Date('2023-10-27T10:00:00Z'),
					updated_at: new Date('2023-10-27T10:00:00Z'),
					author: {
						id: userProfileId,
						displayName: 'Test User',
						icon: 'https://example.com/icon.jpg'
					},
					_count: {
						likes: 1,
						replies: 0
					}
				}
			]

			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			mockPrismaClient.comment.findMany.mockResolvedValue(mockComments)
			mockPrismaClient.comment.count.mockResolvedValue(20) // Exatamente divisível por 10

			// Act
			const response = await httpClient.get('/v1/comment', { 
				ideaId, 
				page: 1, 
				limit: 10 
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.comments).toHaveLength(1)
			expect(response.data.pagination.total).toBe(20)
			expect(response.data.pagination.totalPages).toBe(2)
			expect(response.data.pagination.hasNext).toBe(false)
			expect(response.data.pagination.hasPrev).toBe(true)
		})

		it('should handle pagination with remainder division', async () => {
			// Arrange
			const mockComments = [
				{
					id: TestData.generateUUID(),
					content: 'Remainder division comment',
					ideaId: ideaId,
					parentCommentId: null,
					authorId: userProfileId,
					created_at: new Date('2023-10-27T10:00:00Z'),
					updated_at: new Date('2023-10-27T10:00:00Z'),
					author: {
						id: userProfileId,
						displayName: 'Test User',
						icon: 'https://example.com/icon.jpg'
					},
					_count: {
						likes: 1,
						replies: 0
					}
				}
			]

			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			mockPrismaClient.comment.findMany.mockResolvedValue(mockComments)
			mockPrismaClient.comment.count.mockResolvedValue(25) // 25 / 10 = 2.5, ceil = 3

			// Act
			const response = await httpClient.get('/v1/comment', { 
				ideaId, 
				page: 2, 
				limit: 10 
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.comments).toHaveLength(1)
			expect(response.data.pagination.total).toBe(25)
			expect(response.data.pagination.totalPages).toBe(3)
			expect(response.data.pagination.hasNext).toBe(false)
			expect(response.data.pagination.hasPrev).toBe(true)
		})

		it('should handle default limit when limit is undefined', async () => {
			// Arrange
			const mockComments = [
				{
					id: TestData.generateUUID(),
					content: 'Default limit comment',
					ideaId: ideaId,
					parentCommentId: null,
					authorId: userProfileId,
					created_at: new Date('2023-10-27T10:00:00Z'),
					updated_at: new Date('2023-10-27T10:00:00Z'),
					author: {
						id: userProfileId,
						displayName: 'Test User',
						icon: 'https://example.com/icon.jpg'
					},
					_count: {
						likes: 1,
						replies: 0
					}
				}
			]

			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			mockPrismaClient.comment.findMany.mockResolvedValue(mockComments)
			mockPrismaClient.comment.count.mockResolvedValue(1)

			// Act
			const response = await httpClient.get('/v1/comment', { 
				ideaId, 
				page: 0
				// limit não fornecido
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.comments).toHaveLength(1)
			expect(response.data.pagination.limit).toBe(10) // Default limit
		})

		it('should handle default page when page is undefined', async () => {
			// Arrange
			const mockComments = [
				{
					id: TestData.generateUUID(),
					content: 'Default page comment',
					ideaId: ideaId,
					parentCommentId: null,
					authorId: userProfileId,
					created_at: new Date('2023-10-27T10:00:00Z'),
					updated_at: new Date('2023-10-27T10:00:00Z'),
					author: {
						id: userProfileId,
						displayName: 'Test User',
						icon: 'https://example.com/icon.jpg'
					},
					_count: {
						likes: 1,
						replies: 0
					}
				}
			]

			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			mockPrismaClient.comment.findMany.mockResolvedValue(mockComments)
			mockPrismaClient.comment.count.mockResolvedValue(1)

			// Act
			const response = await httpClient.get('/v1/comment', { 
				ideaId, 
				limit: 5
				// page não fornecido
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.comments).toHaveLength(1)
			expect(response.data.pagination.page).toBe(0) // Default page
		})

		it('should handle both page and limit undefined', async () => {
			// Arrange
			const mockComments = [
				{
					id: TestData.generateUUID(),
					content: 'Both defaults comment',
					ideaId: ideaId,
					parentCommentId: null,
					authorId: userProfileId,
					created_at: new Date('2023-10-27T10:00:00Z'),
					updated_at: new Date('2023-10-27T10:00:00Z'),
					author: {
						id: userProfileId,
						displayName: 'Test User',
						icon: 'https://example.com/icon.jpg'
					},
					_count: {
						likes: 1,
						replies: 0
					}
				}
			]

			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			mockPrismaClient.comment.findMany.mockResolvedValue(mockComments)
			mockPrismaClient.comment.count.mockResolvedValue(1)

			// Act
			const response = await httpClient.get('/v1/comment', { 
				ideaId
				// page e limit não fornecidos
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.comments).toHaveLength(1)
			expect(response.data.pagination.page).toBe(0) // Default page
			expect(response.data.pagination.limit).toBe(10) // Default limit
		})
	})
})

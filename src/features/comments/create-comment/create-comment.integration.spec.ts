import { IntegrationTestSetup } from '@test/setup/integration-test-setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Create Comment Integration Tests', () => {
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

	describe('POST /api/v1/comments', () => {
		it('should create comment successfully with valid data', async () => {
			// Arrange
			const commentData = TestData.createComment()
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					comment: {
						create: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							content: commentData.content,
							ideaId: commentData.ideaId,
							authorId: TestData.generateUUID(),
							parentCommentId: null,
							created_at: new Date(),
							updated_at: new Date()
						})
					}
				}
			})

			// Act
			const response = await httpClient.post('/api/v1/comments', commentData)

			// Assert
			expect(response.status).toBe(201)
			expect(response.data).toHaveProperty('comment')
			expect(response.data.comment.content).toBe(commentData.content)
			expect(response.data.comment.ideaId).toBe(commentData.ideaId)
		})

		it('should create reply comment successfully', async () => {
			// Arrange
			const commentData = TestData.createComment({
				parentCommentId: TestData.generateUUID()
			})
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					comment: {
						create: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							content: commentData.content,
							ideaId: commentData.ideaId,
							authorId: TestData.generateUUID(),
							parentCommentId: commentData.parentCommentId,
							created_at: new Date(),
							updated_at: new Date()
						})
					}
				}
			})

			// Act
			const response = await httpClient.post('/api/v1/comments', commentData)

			// Assert
			expect(response.status).toBe(201)
			expect(response.data.comment.parentCommentId).toBe(commentData.parentCommentId)
		})

		it('should return validation error for empty content', async () => {
			// Arrange
			const commentData = TestData.createComment({ content: '' })

			// Act & Assert
			await expect(httpClient.post('/api/v1/comments', commentData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'CONTENT_REQUIRED'
						}
					}
				})
		})

		it('should return validation error for long content', async () => {
			// Arrange
			const commentData = TestData.createComment({ 
				content: 'A'.repeat(201) // Excede 200 caracteres
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/comments', commentData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'CONTENT_TOO_LONG'
						}
					}
				})
		})

		it('should return validation error for content with special characters', async () => {
			// Arrange
			const commentData = TestData.createComment({ 
				content: 'Comment with {special} characters'
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/comments', commentData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_CONTENT'
						}
					}
				})
		})

		it('should return validation error for invalid idea ID', async () => {
			// Arrange
			const commentData = TestData.createComment({ ideaId: 'invalid-uuid' })

			// Act & Assert
			await expect(httpClient.post('/api/v1/comments', commentData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_IDEA_ID'
						}
					}
				})
		})

		it('should return validation error for invalid parent comment ID', async () => {
			// Arrange
			const commentData = TestData.createComment({ 
				parentCommentId: 'invalid-uuid'
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/comments', commentData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_PARENT_COMMENT_ID'
						}
					}
				})
		})

		it('should return UNAUTHORIZED when no token provided', async () => {
			// Arrange
			const commentData = TestData.createComment()
			httpClient.clearAuthToken()

			// Act & Assert
			await expect(httpClient.post('/api/v1/comments', commentData))
				.rejects.toMatchObject({
					response: {
						status: 401,
						data: {
							message: 'UNAUTHORIZED'
						}
					}
				})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const commentData = TestData.createComment()
			
			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					comment: {
						create: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/comments', commentData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

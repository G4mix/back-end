import { IntegrationTestSetup } from '@test/setup/integration-test-setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Get Comments Integration Tests', () => {
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

	describe('GET /api/v1/comments', () => {
		it('should get comments with pagination successfully', async () => {
			// Arrange
			const ideaId = TestData.generateUUID()
			const mockComments = [
				{
					id: TestData.generateUUID(),
					content: 'Test Comment 1',
					ideaId,
					authorId: TestData.generateUUID(),
					parentCommentId: null,
					created_at: new Date(),
					updated_at: new Date(),
					author: {
						username: 'testuser1',
						userProfile: {
							name: 'Test User 1',
							icon: 'https://example.com/icon1.jpg'
						}
					},
					_count: {
						replies: 2
					}
				},
				{
					id: TestData.generateUUID(),
					content: 'Test Comment 2',
					ideaId,
					authorId: TestData.generateUUID(),
					parentCommentId: null,
					created_at: new Date(),
					updated_at: new Date(),
					author: {
						username: 'testuser2',
						userProfile: {
							name: 'Test User 2',
							icon: 'https://example.com/icon2.jpg'
						}
					},
					_count: {
						replies: 0
					}
				}
			]

			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					comment: {
						findMany: jest.fn().mockResolvedValue(mockComments),
						count: jest.fn().mockResolvedValue(2)
					}
				}
			})

			// Act
			const response = await httpClient.get('/api/v1/comments', {
				ideaId,
				page: 0,
				limit: 10
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('comments')
			expect(response.data).toHaveProperty('pagination')
			expect(response.data.comments).toHaveLength(2)
			expect(response.data.pagination.total).toBe(2)
		})

		it('should get comments with replies successfully', async () => {
			// Arrange
			const ideaId = TestData.generateUUID()
			const parentCommentId = TestData.generateUUID()
			const mockComments = [
				{
					id: parentCommentId,
					content: 'Parent Comment',
					ideaId,
					authorId: TestData.generateUUID(),
					parentCommentId: null,
					created_at: new Date(),
					updated_at: new Date(),
					author: {
						username: 'testuser',
						userProfile: {
							name: 'Test User',
							icon: 'https://example.com/icon.jpg'
						}
					},
					replies: [
						{
							id: TestData.generateUUID(),
							content: 'Reply 1',
							ideaId,
							authorId: TestData.generateUUID(),
							parentCommentId,
							created_at: new Date(),
							updated_at: new Date(),
							author: {
								username: 'replyuser1',
								userProfile: {
									name: 'Reply User 1',
									icon: 'https://example.com/reply1.jpg'
								}
							}
						}
					],
					_count: {
						replies: 1
					}
				}
			]

			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					comment: {
						findMany: jest.fn().mockResolvedValue(mockComments),
						count: jest.fn().mockResolvedValue(1)
					}
				}
			})

			// Act
			const response = await httpClient.get('/api/v1/comments', {
				ideaId,
				page: 0,
				limit: 10
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.comments).toHaveLength(1)
			expect(response.data.comments[0].replies).toHaveLength(1)
		})

		it('should return validation error for invalid idea ID', async () => {
			// Act & Assert
			await expect(httpClient.get('/api/v1/comments', { ideaId: 'invalid-uuid' }))
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
			// Arrange
			const ideaId = TestData.generateUUID()

			// Act & Assert
			await expect(httpClient.get('/api/v1/comments', { ideaId, page: -1 }))
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
			const ideaId = TestData.generateUUID()

			// Act & Assert
			await expect(httpClient.get('/api/v1/comments', { ideaId, limit: 200 }))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'LIMIT_TOO_LARGE'
						}
					}
				})
		})

		it('should return empty array when no comments found', async () => {
			// Arrange
			const ideaId = TestData.generateUUID()

			// Mock do Prisma para retornar array vazio
			IntegrationTestSetup.setupMocks({
				prisma: {
					comment: {
						findMany: jest.fn().mockResolvedValue([]),
						count: jest.fn().mockResolvedValue(0)
					}
				}
			})

			// Act
			const response = await httpClient.get('/api/v1/comments', {
				ideaId,
				page: 0,
				limit: 10
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.comments).toHaveLength(0)
			expect(response.data.pagination.total).toBe(0)
		})

		it('should get comments sorted by creation date', async () => {
			// Arrange
			const ideaId = TestData.generateUUID()
			const mockComments = [
				{
					id: TestData.generateUUID(),
					content: 'Newer Comment',
					ideaId,
					authorId: TestData.generateUUID(),
					parentCommentId: null,
					created_at: new Date('2024-01-02'),
					updated_at: new Date('2024-01-02'),
					author: {
						username: 'testuser1',
						userProfile: {
							name: 'Test User 1',
							icon: 'https://example.com/icon1.jpg'
						}
					},
					_count: {
						replies: 0
					}
				},
				{
					id: TestData.generateUUID(),
					content: 'Older Comment',
					ideaId,
					authorId: TestData.generateUUID(),
					parentCommentId: null,
					created_at: new Date('2024-01-01'),
					updated_at: new Date('2024-01-01'),
					author: {
						username: 'testuser2',
						userProfile: {
							name: 'Test User 2',
							icon: 'https://example.com/icon2.jpg'
						}
					},
					_count: {
						replies: 0
					}
				}
			]

			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					comment: {
						findMany: jest.fn().mockResolvedValue(mockComments),
						count: jest.fn().mockResolvedValue(2)
					}
				}
			})

			// Act
			const response = await httpClient.get('/api/v1/comments', {
				ideaId,
				page: 0,
				limit: 10
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.comments).toHaveLength(2)
			expect(response.data.comments[0].content).toBe('Newer Comment')
			expect(response.data.comments[1].content).toBe('Older Comment')
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const ideaId = TestData.generateUUID()

			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					comment: {
						findMany: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.get('/api/v1/comments', { ideaId, page: 0, limit: 10 }))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

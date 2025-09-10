import { IntegrationTestSetup } from '@test/setup/integration-test-setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Get Ideas Integration Tests', () => {
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

	describe('GET /api/v1/ideas', () => {
		it('should get ideas with pagination successfully', async () => {
			// Arrange
			const mockIdeas = [
				{
					id: TestData.generateUUID(),
					title: 'Test Idea 1',
					description: 'Description 1',
					authorId: TestData.generateUUID(),
					created_at: new Date(),
					updated_at: new Date(),
					_count: {
						likes: 10,
						comments: 5,
						views: 100
					}
				},
				{
					id: TestData.generateUUID(),
					title: 'Test Idea 2',
					description: 'Description 2',
					authorId: TestData.generateUUID(),
					created_at: new Date(),
					updated_at: new Date(),
					_count: {
						likes: 20,
						comments: 10,
						views: 200
					}
				}
			]

			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findMany: jest.fn().mockResolvedValue(mockIdeas),
						count: jest.fn().mockResolvedValue(2)
					}
				}
			})

			// Act
			const response = await httpClient.get('/api/v1/ideas', {
				page: 0,
				limit: 10
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('ideas')
			expect(response.data).toHaveProperty('pagination')
			expect(response.data.ideas).toHaveLength(2)
			expect(response.data.pagination.total).toBe(2)
		})

		it('should get ideas with search query successfully', async () => {
			// Arrange
			const mockIdeas = [
				{
					id: TestData.generateUUID(),
					title: 'React Idea',
					description: 'Description about React',
					authorId: TestData.generateUUID(),
					created_at: new Date(),
					updated_at: new Date(),
					_count: {
						likes: 10,
						comments: 5,
						views: 100
					}
				}
			]

			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findMany: jest.fn().mockResolvedValue(mockIdeas),
						count: jest.fn().mockResolvedValue(1)
					}
				}
			})

			// Act
			const response = await httpClient.get('/api/v1/ideas', {
				page: 0,
				limit: 10,
				search: 'react'
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('ideas')
			expect(response.data.ideas).toHaveLength(1)
		})

		it('should get ideas with tags filter successfully', async () => {
			// Arrange
			const mockIdeas = [
				{
					id: TestData.generateUUID(),
					title: 'Test Idea',
					description: 'Description',
					authorId: TestData.generateUUID(),
					created_at: new Date(),
					updated_at: new Date(),
					tags: [
						{ name: 'react' },
						{ name: 'typescript' }
					],
					_count: {
						likes: 10,
						comments: 5,
						views: 100
					}
				}
			]

			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findMany: jest.fn().mockResolvedValue(mockIdeas),
						count: jest.fn().mockResolvedValue(1)
					}
				}
			})

			// Act
			const response = await httpClient.get('/api/v1/ideas', {
				page: 0,
				limit: 10,
				tags: ['react', 'typescript']
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('ideas')
			expect(response.data.ideas).toHaveLength(1)
		})

		it('should return validation error for invalid page number', async () => {
			// Act & Assert
			await expect(httpClient.get('/api/v1/ideas', { page: -1 }))
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
			await expect(httpClient.get('/api/v1/ideas', { limit: 200 }))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'LIMIT_TOO_LARGE'
						}
					}
				})
		})

		it('should return validation error for negative limit', async () => {
			// Act & Assert
			await expect(httpClient.get('/api/v1/ideas', { limit: -1 }))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_LIMIT'
						}
					}
				})
		})

		it('should return empty array when no ideas found', async () => {
			// Arrange
			// Mock do Prisma para retornar array vazio
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findMany: jest.fn().mockResolvedValue([]),
						count: jest.fn().mockResolvedValue(0)
					}
				}
			})

			// Act
			const response = await httpClient.get('/api/v1/ideas', {
				page: 0,
				limit: 10
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.ideas).toHaveLength(0)
			expect(response.data.pagination.total).toBe(0)
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findMany: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.get('/api/v1/ideas', { page: 0, limit: 10 }))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

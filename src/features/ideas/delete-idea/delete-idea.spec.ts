import { IntegrationTestSetup } from '@test/setup/integration-test-setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Delete Idea Integration Tests', () => {
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

	describe('DELETE /api/v1/ideas/:id', () => {
		it('should delete idea successfully', async () => {
			// Arrange
			const ideaId = TestData.generateUUID()
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findUnique: jest.fn().mockResolvedValue({
							id: ideaId,
							authorId: TestData.generateUUID(),
							title: 'Test Idea',
							description: 'Test Description'
						}),
						delete: jest.fn().mockResolvedValue({
							id: ideaId
						})
					}
				}
			})

			// Act
			const response = await httpClient.delete(`/api/v1/ideas/${ideaId}`)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('message')
		})

		it('should return validation error for invalid UUID', async () => {
			// Act & Assert
			await expect(httpClient.delete('/api/v1/ideas/invalid-uuid'))
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
			const ideaId = TestData.generateUUID()
			httpClient.clearAuthToken()

			// Act & Assert
			await expect(httpClient.delete(`/api/v1/ideas/${ideaId}`))
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
			const ideaId = TestData.generateUUID()

			// Mock do Prisma para retornar null
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findUnique: jest.fn().mockResolvedValue(null)
					}
				}
			})

			// Act & Assert
			await expect(httpClient.delete(`/api/v1/ideas/${ideaId}`))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: {
							message: 'IDEA_NOT_FOUND'
						}
					}
				})
		})

		it('should return FORBIDDEN when user is not the author', async () => {
			// Arrange
			const ideaId = TestData.generateUUID()

			// Mock do Prisma para retornar ideia de outro autor
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findUnique: jest.fn().mockResolvedValue({
							id: ideaId,
							authorId: 'different-author-id',
							title: 'Test Idea',
							description: 'Test Description'
						})
					}
				}
			})

			// Act & Assert
			await expect(httpClient.delete(`/api/v1/ideas/${ideaId}`))
				.rejects.toMatchObject({
					response: {
						status: 403,
						data: {
							message: 'FORBIDDEN'
						}
					}
				})
		})

		it('should delete idea with all related data', async () => {
			// Arrange
			const ideaId = TestData.generateUUID()
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findUnique: jest.fn().mockResolvedValue({
							id: ideaId,
							authorId: TestData.generateUUID(),
							title: 'Test Idea',
							description: 'Test Description',
							tags: [
								{ name: 'react' },
								{ name: 'typescript' }
							],
							images: [
								{ url: 'https://example.com/image1.jpg' },
								{ url: 'https://example.com/image2.jpg' }
							],
							links: [
								{ url: 'https://github.com/example' },
								{ url: 'https://example.com' }
							]
						}),
						delete: jest.fn().mockResolvedValue({
							id: ideaId
						})
					}
				}
			})

			// Act
			const response = await httpClient.delete(`/api/v1/ideas/${ideaId}`)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('message')
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const ideaId = TestData.generateUUID()

			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findUnique: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.delete(`/api/v1/ideas/${ideaId}`))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

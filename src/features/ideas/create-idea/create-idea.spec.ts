import { IntegrationTestSetup } from '@test/setup/integration-test-setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Create Idea Integration Tests', () => {
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

	describe('POST /api/v1/ideas', () => {
		it('should create idea successfully with valid data', async () => {
			// Arrange
			const ideaData = TestData.createIdea()
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findFirst: jest.fn().mockResolvedValue(null), // Título não existe
						create: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							title: ideaData.title,
							description: ideaData.description,
							authorId: TestData.generateUUID(),
							created_at: new Date(),
							updated_at: new Date(),
							tags: ideaData.tags?.map((name: string) => ({
								id: TestData.generateUUID(),
								name
							})),
							images: [],
							links: ideaData.links?.map((link: any) => ({
								id: TestData.generateUUID(),
								url: link.url
							}))
						})
					}
				}
			})

			// Act
			const response = await httpClient.post('/api/v1/ideas', ideaData)

			// Assert
			expect(response.status).toBe(201)
			expect(response.data).toHaveProperty('idea')
			expect(response.data.idea.title).toBe(ideaData.title)
			expect(response.data.idea.description).toBe(ideaData.description)
		})

		it('should return validation error for short title', async () => {
			// Arrange
			const ideaData = TestData.createIdea({ title: 'Short' })

			// Act & Assert
			await expect(httpClient.post('/api/v1/ideas', ideaData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'TITLE_TOO_SHORT'
						}
					}
				})
		})

		it('should return validation error for long title', async () => {
			// Arrange
			const ideaData = TestData.createIdea({ 
				title: 'This is a very long title that exceeds the maximum allowed length of 70 characters and should fail validation'
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/ideas', ideaData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'TITLE_TOO_LONG'
						}
					}
				})
		})

		it('should return validation error for title with special characters', async () => {
			// Arrange
			const ideaData = TestData.createIdea({ title: 'Title with {special} characters' })

			// Act & Assert
			await expect(httpClient.post('/api/v1/ideas', ideaData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_TITLE'
						}
					}
				})
		})

		it('should return validation error for short description', async () => {
			// Arrange
			const ideaData = TestData.createIdea({ description: 'Short desc' })

			// Act & Assert
			await expect(httpClient.post('/api/v1/ideas', ideaData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'DESCRIPTION_TOO_SHORT'
						}
					}
				})
		})

		it('should return validation error for long description', async () => {
			// Arrange
			const ideaData = TestData.createIdea({ 
				description: 'A'.repeat(701) // Excede 700 caracteres
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/ideas', ideaData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'DESCRIPTION_TOO_LONG'
						}
					}
				})
		})

		it('should return validation error for description with special characters', async () => {
			// Arrange
			const ideaData = TestData.createIdea({ 
				description: 'Description with {special} characters that should fail validation'
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/ideas', ideaData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_DESCRIPTION'
						}
					}
				})
		})

		it('should return validation error for empty tag', async () => {
			// Arrange
			const ideaData = TestData.createIdea({ 
				tags: ['valid-tag', '', 'another-valid-tag']
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/ideas', ideaData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'TAG_EMPTY'
						}
					}
				})
		})

		it('should return validation error for long tag', async () => {
			// Arrange
			const ideaData = TestData.createIdea({ 
				tags: ['a'.repeat(51)] // Excede 50 caracteres
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/ideas', ideaData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'TAG_TOO_LONG'
						}
					}
				})
		})

		it('should return validation error for invalid link URL', async () => {
			// Arrange
			const ideaData = TestData.createIdea({ 
				links: [{ url: 'invalid-url' }]
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/ideas', ideaData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_LINK_URL'
						}
					}
				})
		})

		it('should return validation error for link URL without http', async () => {
			// Arrange
			const ideaData = TestData.createIdea({ 
				links: [{ url: 'example.com' }]
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/ideas', ideaData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_LINK_URL'
						}
					}
				})
		})

		it('should return validation error for long link URL', async () => {
			// Arrange
			const ideaData = TestData.createIdea({ 
				links: [{ url: 'https://example.com/' + 'a'.repeat(700) }]
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/ideas', ideaData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'LINK_URL_TOO_LONG'
						}
					}
				})
		})

		it('should return UNAUTHORIZED when no token provided', async () => {
			// Arrange
			const ideaData = TestData.createIdea()
			httpClient.clearAuthToken()

			// Act & Assert
			await expect(httpClient.post('/api/v1/ideas', ideaData))
				.rejects.toMatchObject({
					response: {
						status: 401,
						data: {
							message: 'UNAUTHORIZED'
						}
					}
				})
		})

		it('should return IDEA_ALREADY_EXISTS when title already exists', async () => {
			// Arrange
			const ideaData = TestData.createIdea()
			
			// Mock do Prisma para retornar ideia existente
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findFirst: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							title: ideaData.title
						})
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/ideas', ideaData))
				.rejects.toMatchObject({
					response: {
						status: 409,
						data: {
							message: 'IDEA_ALREADY_EXISTS'
						}
					}
				})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const ideaData = TestData.createIdea()
			
			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findFirst: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/ideas', ideaData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})

		it('should create idea with tags, images and links successfully', async () => {
			// Arrange
			const ideaData = TestData.createIdea({
				tags: ['react', 'typescript', 'nodejs'],
				links: [
					{ url: 'https://github.com/example' },
					{ url: 'https://example.com' }
				]
			})
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findFirst: jest.fn().mockResolvedValue(null),
						create: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							title: ideaData.title,
							description: ideaData.description,
							authorId: TestData.generateUUID(),
							created_at: new Date(),
							updated_at: new Date(),
							tags: ideaData.tags?.map((name: string) => ({
								id: TestData.generateUUID(),
								name
							})),
							images: [],
							links: ideaData.links?.map((link: any) => ({
								id: TestData.generateUUID(),
								url: link.url
							}))
						})
					}
				}
			})

			// Act
			const response = await httpClient.post('/api/v1/ideas', ideaData)

			// Assert
			expect(response.status).toBe(201)
			expect(response.data.idea.tags).toHaveLength(3)
			expect(response.data.idea.links).toHaveLength(2)
		})
	})
})

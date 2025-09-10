import { IntegrationTestSetup } from '@test/setup/integration-test-setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Update Idea Integration Tests', () => {
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

	describe('PUT /api/v1/ideas/:id', () => {
		it('should update idea successfully with valid data', async () => {
			// Arrange
			const ideaId = TestData.generateUUID()
			const updateData = {
				title: 'Updated Idea Title - This is a valid title with enough characters',
				description: 'This is an updated description with enough characters to pass validation. It needs to be at least 50 characters long and less than 700 characters.',
				tags: ['updated', 'idea'],
				links: [{ url: 'https://updated-example.com' }]
			}
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findUnique: jest.fn().mockResolvedValue({
							id: ideaId,
							authorId: TestData.generateUUID(),
							title: 'Old Title',
							description: 'Old Description'
						}),
						findFirst: jest.fn().mockResolvedValue(null), // Título não existe
						update: jest.fn().mockResolvedValue({
							id: ideaId,
							title: updateData.title,
							description: updateData.description,
							authorId: TestData.generateUUID(),
							created_at: new Date(),
							updated_at: new Date(),
							tags: updateData.tags?.map((name: string) => ({
								id: TestData.generateUUID(),
								name
							})),
							links: updateData.links?.map((link: any) => ({
								id: TestData.generateUUID(),
								url: link.url
							}))
						})
					}
				}
			})

			// Act
			const response = await httpClient.put(`/api/v1/ideas/${ideaId}`, updateData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('idea')
			expect(response.data.idea.title).toBe(updateData.title)
			expect(response.data.idea.description).toBe(updateData.description)
		})

		it('should return validation error for invalid UUID', async () => {
			// Arrange
			const updateData = {
				title: 'Updated Title',
				description: 'Updated Description'
			}

			// Act & Assert
			await expect(httpClient.put('/api/v1/ideas/invalid-uuid', updateData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_IDEA_ID'
						}
					}
				})
		})

		it('should return validation error for short title', async () => {
			// Arrange
			const ideaId = TestData.generateUUID()
			const updateData = {
				title: 'Short',
				description: 'Updated Description'
			}

			// Act & Assert
			await expect(httpClient.put(`/api/v1/ideas/${ideaId}`, updateData))
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
			const ideaId = TestData.generateUUID()
			const updateData = {
				title: 'This is a very long title that exceeds the maximum allowed length of 70 characters and should fail validation',
				description: 'Updated Description'
			}

			// Act & Assert
			await expect(httpClient.put(`/api/v1/ideas/${ideaId}`, updateData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'TITLE_TOO_LONG'
						}
					}
				})
		})

		it('should return validation error for short description', async () => {
			// Arrange
			const ideaId = TestData.generateUUID()
			const updateData = {
				title: 'Updated Title',
				description: 'Short desc'
			}

			// Act & Assert
			await expect(httpClient.put(`/api/v1/ideas/${ideaId}`, updateData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'DESCRIPTION_TOO_SHORT'
						}
					}
				})
		})

		it('should return validation error for invalid link URL', async () => {
			// Arrange
			const ideaId = TestData.generateUUID()
			const updateData = {
				title: 'Updated Title',
				description: 'Updated Description',
				links: [{ url: 'invalid-url' }]
			}

			// Act & Assert
			await expect(httpClient.put(`/api/v1/ideas/${ideaId}`, updateData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_LINK_URL'
						}
					}
				})
		})

		it('should return UNAUTHORIZED when no token provided', async () => {
			// Arrange
			const ideaId = TestData.generateUUID()
			const updateData = {
				title: 'Updated Title',
				description: 'Updated Description'
			}
			httpClient.clearAuthToken()

			// Act & Assert
			await expect(httpClient.put(`/api/v1/ideas/${ideaId}`, updateData))
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
			const updateData = {
				title: 'Updated Title',
				description: 'Updated Description'
			}

			// Mock do Prisma para retornar null
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findUnique: jest.fn().mockResolvedValue(null)
					}
				}
			})

			// Act & Assert
			await expect(httpClient.put(`/api/v1/ideas/${ideaId}`, updateData))
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
			const updateData = {
				title: 'Updated Title',
				description: 'Updated Description'
			}

			// Mock do Prisma para retornar ideia de outro autor
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findUnique: jest.fn().mockResolvedValue({
							id: ideaId,
							authorId: 'different-author-id',
							title: 'Old Title',
							description: 'Old Description'
						})
					}
				}
			})

			// Act & Assert
			await expect(httpClient.put(`/api/v1/ideas/${ideaId}`, updateData))
				.rejects.toMatchObject({
					response: {
						status: 403,
						data: {
							message: 'FORBIDDEN'
						}
					}
				})
		})

		it('should return IDEA_ALREADY_EXISTS when title already exists', async () => {
			// Arrange
			const ideaId = TestData.generateUUID()
			const updateData = {
				title: 'Existing Title',
				description: 'Updated Description'
			}

			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findUnique: jest.fn().mockResolvedValue({
							id: ideaId,
							authorId: TestData.generateUUID(),
							title: 'Old Title',
							description: 'Old Description'
						}),
						findFirst: jest.fn().mockResolvedValue({
							id: 'different-idea-id',
							title: updateData.title
						})
					}
				}
			})

			// Act & Assert
			await expect(httpClient.put(`/api/v1/ideas/${ideaId}`, updateData))
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
			const ideaId = TestData.generateUUID()
			const updateData = {
				title: 'Updated Title',
				description: 'Updated Description'
			}

			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findUnique: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.put(`/api/v1/ideas/${ideaId}`, updateData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

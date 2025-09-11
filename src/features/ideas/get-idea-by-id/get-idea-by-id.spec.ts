import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestTokens } from '@test/helpers/test-tokens'
import { TestData } from '@test/helpers/test-data'

describe('Get Idea By ID Integration Tests', () => {
	let httpClient: HttpClient
	let baseUrl: string
	let authToken: string

	beforeAll(async () => {
		// Usa o servidor global
		baseUrl = IntegrationTestSetup.getBaseUrl()
		httpClient = new HttpClient(baseUrl)
		
		// Gera token válido usando o helper
		authToken = TestTokens.generateValidToken()
		httpClient.setAuthToken(authToken)
	})

	beforeEach(() => {
		// Limpa mocks antes de cada teste
		IntegrationTestSetup.clearMocks()
	})

	describe('GET /v1/ideas/:id', () => {
		it('should get idea by id successfully', async () => {
			// Arrange
			const ideaId = TestData.generateUUID()
			const mockIdea = {
				id: ideaId,
				title: 'Test Idea',
				description: 'Test Description',
				authorId: TestData.generateUUID(),
				created_at: new Date(),
				updated_at: new Date(),
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
				],
				_count: {
					likes: 10,
					comments: 5,
					views: 100
				}
			}

			// Mock do Prisma (seguindo diretriz 2 - modificar mocks globais)
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			
			// Mock do usuário para o middleware de segurança
			mockPrismaClient.user.findUnique.mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'test@example.com',
				username: 'testuser',
				verified: true,
				created_at: new Date(),
				updated_at: new Date(),
				userProfile: {
					id: 'profile-123',
					displayName: 'Test User'
				}
			})
			
			// Mock da ideia
			mockPrismaClient.idea.findUnique.mockResolvedValue(mockIdea)

			// Act
			const response = await httpClient.get(`/v1/ideas/${ideaId}`)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('idea')
			expect(response.data.idea.id).toBe(ideaId)
			expect(response.data.idea.title).toBe('Test Idea')
			expect(response.data.idea.tags).toHaveLength(2)
			expect(response.data.idea.images).toHaveLength(2)
			expect(response.data.idea.links).toHaveLength(2)
		})

		it('should return validation error for invalid UUID', async () => {
			// Arrange - Mock do usuário para o middleware de segurança
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'test@example.com',
				username: 'testuser',
				verified: true,
				created_at: new Date(),
				updated_at: new Date(),
				userProfile: {
					id: 'profile-123',
					displayName: 'Test User'
				}
			})

			// Act & Assert
			await expect(httpClient.get('/v1/ideas/invalid-uuid'))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_IDEA_ID',
							details: [
								{
									field: 'id',
									message: 'INVALID_IDEA_ID',
									code: 'invalid_string'
								}
							]
						}
					}
				})
		})

		it('should return IDEA_NOT_FOUND when idea does not exist', async () => {
			// Arrange
			const ideaId = TestData.generateUUID()

			// Mock do Prisma (seguindo diretriz 2 - modificar mocks globais)
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			
			// Mock do usuário para o middleware de segurança
			mockPrismaClient.user.findUnique.mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'test@example.com',
				username: 'testuser',
				verified: true,
				created_at: new Date(),
				updated_at: new Date(),
				userProfile: {
					id: 'profile-123',
					displayName: 'Test User'
				}
			})
			
			// Mock da ideia como null (não encontrada)
			mockPrismaClient.idea.findUnique.mockResolvedValue(null)

			// Act & Assert
			await expect(httpClient.get(`/v1/ideas/${ideaId}`))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: 'IDEA_NOT_FOUND'
					}
				})
		})

		it('should get idea with all related data', async () => {
			// Arrange
			const ideaId = TestData.generateUUID()
			const mockIdea = {
				id: ideaId,
				title: 'Complete Idea',
				description: 'Complete Description',
				authorId: TestData.generateUUID(),
				created_at: new Date(),
				updated_at: new Date(),
				author: {
					id: TestData.generateUUID(),
					username: 'testuser',
					email: 'test@example.com',
					userProfile: {
						name: 'Test User',
						bio: 'Test Bio',
						icon: 'https://example.com/icon.jpg'
					}
				},
				tags: [
					{ name: 'react' },
					{ name: 'typescript' },
					{ name: 'nodejs' }
				],
				images: [
					{ url: 'https://example.com/image1.jpg' },
					{ url: 'https://example.com/image2.jpg' },
					{ url: 'https://example.com/image3.jpg' }
				],
				links: [
					{ url: 'https://github.com/example' },
					{ url: 'https://example.com' },
					{ url: 'https://docs.example.com' }
				],
				_count: {
					likes: 25,
					comments: 12,
					views: 500
				}
			}

			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findUnique: jest.fn().mockResolvedValue(mockIdea)
					}
				}
			})

			// Act
			const response = await httpClient.get(`/v1/ideas/${ideaId}`)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.idea.author).toBeDefined()
			expect(response.data.idea.author.username).toBe('testuser')
			expect(response.data.idea.tags).toHaveLength(3)
			expect(response.data.idea.images).toHaveLength(3)
			expect(response.data.idea.links).toHaveLength(3)
			expect(response.data.idea._count.likes).toBe(25)
			expect(response.data.idea._count.comments).toBe(12)
			expect(response.data.idea._count.views).toBe(500)
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
			await expect(httpClient.get(`/v1/ideas/${ideaId}`))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

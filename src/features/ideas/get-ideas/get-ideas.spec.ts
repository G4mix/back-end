import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestTokens } from '@test/helpers/test-tokens'

describe('Get Ideas Integration Tests', () => {
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

	describe('GET /v1/ideas', () => {
		it('should get ideas with pagination successfully', async () => {
			// Arrange - Mock do Prisma (seguindo diretriz 2 - modificar mocks globais)
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
			
			// Mock das ideias
			const mockIdeas = [
				{
					id: 'idea-1',
					title: 'Test Idea 1',
					description: 'Description 1',
					authorId: 'user-1',
					created_at: new Date(),
					updated_at: new Date(),
					_count: { likes: 10, comments: 5, views: 100 }
				},
				{
					id: 'idea-2',
					title: 'Test Idea 2',
					description: 'Description 2',
					authorId: 'user-2',
					created_at: new Date(),
					updated_at: new Date(),
					_count: { likes: 15, comments: 8, views: 150 }
				}
			]
			
			mockPrismaClient.idea.findMany.mockResolvedValue(mockIdeas)
			mockPrismaClient.idea.count.mockResolvedValue(2)

			// Act
			const response = await httpClient.get('/v1/ideas?page=0&limit=10')

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('ideas')
			expect(response.data).toHaveProperty('pagination')
			expect(response.data.ideas).toHaveLength(2)
			expect(response.data.pagination.total).toBe(2)
		})

		it('should get ideas with search query successfully', async () => {
			// Arrange
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
			
			const mockIdeas = [
				{
					id: 'idea-1',
					title: 'React Idea',
					description: 'Description about React',
					authorId: 'user-1',
					created_at: new Date(),
					updated_at: new Date(),
					_count: {
						likes: 10,
						comments: 5,
						views: 100
					}
				}
			]
			
			mockPrismaClient.idea.findMany.mockResolvedValue(mockIdeas)
			mockPrismaClient.idea.count.mockResolvedValue(1)

			// Act
			const response = await httpClient.get('/v1/ideas?page=0&limit=10&search=react')

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('ideas')
			expect(response.data.ideas).toHaveLength(1)
		})

		it('should get ideas with tags filter successfully', async () => {
			// Arrange
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
			
			const mockIdeas = [
				{
					id: 'idea-1',
					title: 'Test Idea',
					description: 'Description',
					authorId: 'user-1',
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
			
			mockPrismaClient.idea.findMany.mockResolvedValue(mockIdeas)
			mockPrismaClient.idea.count.mockResolvedValue(1)

			// Act
			const response = await httpClient.get('/v1/ideas?page=0&limit=10&tags[]=react&tags[]=typescript')

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('ideas')
			expect(response.data.ideas).toHaveLength(1)
		})

		it('should return validation error for invalid page number', async () => {
			// Arrange
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

			// Act & Assert
			await expect(httpClient.get('/v1/ideas?page=-1'))
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

			// Act & Assert
			await expect(httpClient.get('/v1/ideas?limit=200'))
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
			// Arrange
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

			// Act & Assert
			await expect(httpClient.get('/v1/ideas?limit=-1'))
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
			
			// Mock sem ideias
			mockPrismaClient.idea.findMany.mockResolvedValue([])
			mockPrismaClient.idea.count.mockResolvedValue(0)

			// Act
			const response = await httpClient.get('/v1/ideas?page=0&limit=10&authorId=00000000-0000-0000-0000-000000000000')

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.ideas).toHaveLength(0)
			expect(response.data.pagination.total).toBe(0)
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
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
			
			// Mock de erro no banco
			mockPrismaClient.idea.findMany.mockRejectedValue(new Error('Database connection failed'))

			// Act & Assert
			await expect(httpClient.get('/v1/ideas?page=0&limit=10'))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})
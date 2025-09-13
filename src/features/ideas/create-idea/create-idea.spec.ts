import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestTokens } from '@test/helpers/test-tokens'
import { container } from 'tsyringe'
import { TestData } from '@test/helpers/test-data'

describe('Create Idea Integration Tests', () => {
	let httpClient: HttpClient
	let baseUrl: string
	let authToken: string

	beforeAll(async () => {
		baseUrl = IntegrationTestSetup.getBaseUrl()
		httpClient = new HttpClient(baseUrl)
		
		// Gera token JWT válido para testes
		authToken = TestTokens.generateValidToken()
	})

	describe('POST /v1/ideas', () => {
		it('should create idea successfully with valid data', async () => {
			// Arrange
			const ideaData = {
				title: 'Test Idea - This is a valid title with enough characters',
				description: 'This is a test idea description with enough characters to pass validation. It needs to be at least 50 characters long and less than 700 characters.',
				tags: ['test', 'idea'],
				images: [],
				links: []
			}

			// Mock do Prisma
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			
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
			
			// Mock das operações de ideia
			mockPrismaClient.idea.findFirst.mockResolvedValue(null) // Nenhuma ideia com esse título (findByTitle)
			mockPrismaClient.idea.create.mockResolvedValue({
				id: 'idea-123',
				title: ideaData.title,
				description: ideaData.description,
				tags: ideaData.tags,
				images: ideaData.images,
				links: ideaData.links,
				author_id: 'user-123',
				created_at: new Date(),
				updated_at: new Date(),
				author: {
					id: 'user-123',
					username: 'testuser',
					userProfile: {
						displayName: 'Test User'
					}
				}
			})
			
			// Mock do S3Client para upload de imagens
			const mockS3Client = container.resolve('S3Client') as any
			mockS3Client.send.mockResolvedValue({})

			// Act
			httpClient.setAuthToken(authToken)
			const response = await httpClient.post('/v1/ideas', ideaData)

			// Debug
			console.log('Response status:', response.status)
			console.log('Response body:', response.data)

			// Assert
			expect(response.status).toBe(201)
			expect(response.data).toHaveProperty('idea')
			expect(response.data.idea).toHaveProperty('id')
			expect(response.data.idea.title).toBe(ideaData.title)
			expect(response.data.idea.description).toBe(ideaData.description)
			expect(response.data.idea).toHaveProperty('author')
			expect(response.data.idea).toHaveProperty('created_at')
		})

		it('should return validation error for empty title', async () => {
			// Arrange
			const ideaData = {
				title: '',
				description: 'This is a test idea description with enough characters to pass validation.',
				tags: ['test', 'idea'],
				images: [],
				links: []
			}

			// Act & Assert
			httpClient.setAuthToken(authToken)
			await expect(httpClient.post('/v1/ideas', ideaData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'TITLE_TOO_SHORT'
						}
					}
				})
		})

		it('should return validation error for empty description', async () => {
			// Arrange
			const ideaData = {
				title: 'Test Idea - This is a valid title with enough characters',
				description: '',
				tags: ['test', 'idea'],
				images: [],
				links: []
			}

			// Act & Assert
			httpClient.setAuthToken(authToken)
			await expect(httpClient.post('/v1/ideas', ideaData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'DESCRIPTION_TOO_SHORT'
						}
					}
				})
		})

		it('should return UNAUTHORIZED when no token provided', async () => {
			// Arrange
			const ideaData = {
				title: 'Test Idea - This is a valid title with enough characters',
				description: 'This is a test idea description with enough characters to pass validation.',
				tags: ['test', 'idea'],
				images: [],
				links: []
			}

			// Act & Assert
			httpClient.setAuthToken('') // Remove token
			await expect(httpClient.post('/v1/ideas', ideaData))
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
			const ideaData = {
				title: 'Test Idea - This is a valid title with enough characters',
				description: 'This is a test idea description with enough characters to pass validation.',
				tags: ['test', 'idea'],
				images: [],
				links: []
			}

			// Mock do Prisma - aplica após o reset do beforeEach
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			const userData = TestData.createUser()
			mockPrismaClient.user.findUnique.mockResolvedValue(userData)
			mockPrismaClient.idea.findFirst.mockRejectedValue(new Error('Database connection failed'))

			// Act & Assert
			httpClient.setAuthToken(authToken)
			await expect(httpClient.post('/v1/ideas', ideaData))
				.rejects.toMatchObject({
					response: {
						status: 500,
						data: { message: 'ERROR_WHILE_CHECKING_EMAIL' }
					}
				})
		})
	})
})
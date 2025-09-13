import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestTokens } from '@test/helpers/test-tokens'
import { container } from 'tsyringe'

describe('Update Idea Integration Tests', () => {
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

	describe('PATCH /v1/idea/:id', () => {
		it('should update idea successfully with valid data', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'
			const updateData = {
				title: 'Updated Idea Title - This is a valid title with enough characters',
				description: 'This is an updated test idea description with enough characters to pass validation. It needs to be at least 50 characters long and less than 700 characters.',
				tags: ['updated', 'idea'],
				images: [],
				links: []
			}

			// Mock do Prisma (seguindo diretriz 2 - modificar mocks globais)
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
			
			// Mock da ideia existente
			const existingIdea = {
				id: ideaId,
				title: 'Original Title',
				description: 'Original Description',
				authorId: 'profile-123', // Mesmo autor do usuário logado (userProfileId)
				created_at: new Date(),
				updated_at: new Date()
			}
			
			// Mock da ideia atualizada
			const updatedIdea = {
				...existingIdea,
				...updateData,
				updated_at: new Date()
			}
			
			// Mock do Prisma também (já que o repositório usa o Prisma internamente)
			mockPrismaClient.idea.findUnique.mockResolvedValue(existingIdea)
			mockPrismaClient.idea.update.mockResolvedValue(updatedIdea)
			
			// Mock do Prisma já configurado acima
			
			
			// Mock do S3Client para upload de imagens
			const mockS3Client = container.resolve('S3Client') as any
			mockS3Client.send.mockResolvedValue({})

			// Act & Assert
			try {
				const response = await httpClient.patch(`/v1/idea/${ideaId}`, updateData)
				expect(response.status).toBe(200)
				expect(response.data).toHaveProperty('idea')
				expect(response.data.idea.title).toBe(updateData.title)
				expect(response.data.idea.description).toBe(updateData.description)
				expect(response.data.idea.tags).toEqual(updateData.tags)
			} catch (error: any) {
				console.log('Error response:', error.response?.data)
				console.log('Error status:', error.response?.status)
				throw error
			}
		})

		it('should return validation error for empty title', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'
			const updateData = {
				title: '',
				description: 'This is an updated test idea description with enough characters to pass validation.',
				tags: ['updated', 'idea'],
				images: [],
				links: []
			}

			// Mock do Prisma (seguindo diretriz 2 - modificar mocks globais)
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
			
			// Mock da ideia existente para que passe na validação de autor
			const existingIdea = {
				id: ideaId,
				title: 'Original Title',
				description: 'Original Description',
				authorId: 'profile-123',
				created_at: new Date(),
				updated_at: new Date()
			}
			
			mockPrismaClient.idea.findUnique.mockResolvedValue(existingIdea)
			
			// Mock do Prisma já configurado acima

			// Act & Assert
			await expect(httpClient.patch(`/v1/idea/${ideaId}`, updateData))
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
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'
			const updateData = {
				title: 'Updated Idea Title - This is a valid title with enough characters',
				description: '',
				tags: ['updated', 'idea'],
				images: [],
				links: []
			}

			// Mock do Prisma (seguindo diretriz 2 - modificar mocks globais)
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
			
			// Mock da ideia existente para que passe na validação de autor
			const existingIdea = {
				id: ideaId,
				title: 'Original Title',
				description: 'Original Description',
				authorId: 'profile-123',
				created_at: new Date(),
				updated_at: new Date()
			}
			
			mockPrismaClient.idea.findUnique.mockResolvedValue(existingIdea)
			
			// Mock do Prisma já configurado acima

			// Act & Assert
			await expect(httpClient.patch(`/v1/idea/${ideaId}`, updateData))
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
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'
			const updateData = {
				title: 'Updated Idea Title - This is a valid title with enough characters',
				description: 'This is an updated test idea description with enough characters to pass validation.',
				tags: ['updated', 'idea'],
				images: [],
				links: []
			}

			// Act & Assert
			httpClient.setAuthToken('') // Remove token
			await expect(httpClient.patch(`/v1/idea/${ideaId}`, updateData))
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
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'
			const updateData = {
				title: 'Updated Idea Title - This is a valid title with enough characters',
				description: 'This is an updated test idea description with enough characters to pass validation.',
				tags: ['updated', 'idea'],
				images: [],
				links: []
			}

			// Define token válido para este teste
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

			// Mock do Prisma (seguindo diretriz 2 - modificar mocks globais)
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
			
			// Mock da ideia como null (não encontrada)
			mockPrismaClient.idea.findUnique.mockResolvedValue(null)
			
			// Mock do Prisma já configurado acima

			// Act & Assert
			await expect(httpClient.patch(`/v1/idea/${ideaId}`, updateData))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: { message: 'NOT_FOUNDED_DATA' }
					}
				})
		})

		it('should return FORBIDDEN when user is not the author', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'
			const updateData = {
				title: 'Updated Idea Title - This is a valid title with enough characters',
				description: 'This is an updated test idea description with enough characters to pass validation.',
				tags: ['updated', 'idea'],
				images: [],
				links: []
			}

			// Define token válido para este teste
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

			// Mock do Prisma (seguindo diretriz 2 - modificar mocks globais)
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
			
			// Mock da ideia com autor diferente
			const existingIdea = {
				id: ideaId,
				title: 'Original Title',
				description: 'Original Description',
				authorId: 'different-user-id', // Autor diferente
				created_at: new Date(),
				updated_at: new Date()
			}
			
			mockPrismaClient.idea.findUnique.mockResolvedValue(existingIdea)
			
			// Mock do Prisma já configurado acima

			// Act & Assert
			await expect(httpClient.patch(`/v1/idea/${ideaId}`, updateData))
				.rejects.toMatchObject({
					response: {
						status: 403,
						data: { message: 'YOU_ARE_NOT_THE_AUTHOR' }
					}
				})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'
			const updateData = {
				title: 'Updated Idea Title - This is a valid title with enough characters',
				description: 'This is an updated test idea description with enough characters to pass validation.',
				tags: ['updated', 'idea'],
				images: [],
				links: []
			}

			// Define token válido para este teste
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

			// Mock do Prisma (seguindo diretriz 2 - modificar mocks globais)
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
			
			// Mock de erro no banco
			mockPrismaClient.idea.findUnique.mockRejectedValue(new Error('Database connection failed'))

			// Act & Assert
			await expect(httpClient.patch(`/v1/idea/${ideaId}`, updateData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})
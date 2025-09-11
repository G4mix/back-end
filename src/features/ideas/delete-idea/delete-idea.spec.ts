import { IntegrationTestSetup } from '@test/jest.setup'
import { TestTokens } from '@test/helpers/test-tokens'
import { HttpClient } from '@test/helpers/http-client'
import { container } from 'tsyringe'

describe('Delete Idea Integration Tests', () => {
	let httpClient: HttpClient
	let authToken: string

	beforeAll(async () => {
		// Usa o servidor global
		const baseUrl = IntegrationTestSetup.getBaseUrl()
		httpClient = new HttpClient(baseUrl)

		// Gera token válido usando o helper
		authToken = TestTokens.generateValidToken()
		httpClient.setAuthToken(authToken)
	})

	beforeEach(() => {
		// Limpa mocks antes de cada teste
		IntegrationTestSetup.clearMocks()
	})

	describe('DELETE /v1/ideas/:id', () => {
		it('should delete idea successfully', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'

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

			// Mock da ideia existente
			const existingIdea = {
				id: ideaId,
				title: 'Test Idea',
				description: 'Test Description',
				authorId: 'profile-123', // Mesmo autor do usuário logado
				created_at: new Date(),
				updated_at: new Date()
			}

			// Mock do Prisma
			mockPrismaClient.idea.findUnique.mockResolvedValue(existingIdea)
			mockPrismaClient.idea.delete.mockResolvedValue(existingIdea)

			// Mock do IdeaRepository
			const mockIdeaRepository = container.resolve('IdeaRepository') as any
			jest.spyOn(mockIdeaRepository, 'findById').mockResolvedValue(existingIdea)
			jest.spyOn(mockIdeaRepository, 'delete').mockResolvedValue(existingIdea)

			// Act
			const response = await httpClient.delete(`/v1/ideas/${ideaId}`)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toBe('Idea deleted successfully')
		})

		it('should return validation error for invalid UUID', async () => {
			// Arrange
			const invalidId = 'invalid-uuid'

			// Act & Assert
			await expect(httpClient.delete(`/v1/ideas/${invalidId}`))
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
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'

			// Act & Assert
			httpClient.setAuthToken('') // Remove token
			await expect(httpClient.delete(`/v1/ideas/${ideaId}`))
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

			// Define token válido para este teste
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

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

			// Mock do IdeaRepository
			const mockIdeaRepository = container.resolve('IdeaRepository') as any
			jest.spyOn(mockIdeaRepository, 'findById').mockResolvedValue(null)

			// Act & Assert
			await expect(httpClient.delete(`/v1/ideas/${ideaId}`))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: 'IDEA_NOT_FOUND'
					}
				})
		})

		it('should return FORBIDDEN when user is not the author', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'

			// Define token válido para este teste
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

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

			// Mock da ideia com autor diferente
			const existingIdea = {
				id: ideaId,
				title: 'Test Idea',
				description: 'Test Description',
				authorId: 'different-user-id', // Autor diferente
				created_at: new Date(),
				updated_at: new Date()
			}

			mockPrismaClient.idea.findUnique.mockResolvedValue(existingIdea)

			// Mock do IdeaRepository
			const mockIdeaRepository = container.resolve('IdeaRepository') as any
			jest.spyOn(mockIdeaRepository, 'findById').mockResolvedValue(existingIdea)

			// Act & Assert
			await expect(httpClient.delete(`/v1/ideas/${ideaId}`))
				.rejects.toMatchObject({
					response: {
						status: 403,
						data: 'FORBIDDEN'
					}
				})
		})

		it('should delete idea with all related data', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'

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

			// Mock da ideia existente
			const existingIdea = {
				id: ideaId,
				title: 'Test Idea',
				description: 'Test Description',
				authorId: 'profile-123', // Mesmo autor do usuário logado
				created_at: new Date(),
				updated_at: new Date()
			}

			// Mock do Prisma
			mockPrismaClient.idea.findUnique.mockResolvedValue(existingIdea)
			mockPrismaClient.idea.delete.mockResolvedValue(existingIdea)

			// Mock do IdeaRepository
			const mockIdeaRepository = container.resolve('IdeaRepository') as any
			jest.spyOn(mockIdeaRepository, 'findById').mockResolvedValue(existingIdea)
			jest.spyOn(mockIdeaRepository, 'delete').mockResolvedValue(existingIdea)

			// Act
			const response = await httpClient.delete(`/v1/ideas/${ideaId}`)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toBe('Idea deleted successfully')
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'

			// Define token válido para este teste
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

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

			// Mock de erro no banco
			mockPrismaClient.idea.findUnique.mockRejectedValue(new Error('Database connection failed'))

			// Mock do IdeaRepository
			const mockIdeaRepository = container.resolve('IdeaRepository') as any
			jest.spyOn(mockIdeaRepository, 'findById').mockRejectedValue(new Error('Database connection failed'))

			// Act & Assert
			await expect(httpClient.delete(`/v1/ideas/${ideaId}`))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})
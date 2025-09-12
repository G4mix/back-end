import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'
import { TestTokens } from '@test/helpers/test-tokens'
import { container } from 'tsyringe'

describe('Delete User Integration Tests', () => {
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

	describe('DELETE /v1/users', () => {
		it('should delete user successfully', async () => {
			// Arrange
			// Mock do Prisma para autenticação
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockResolvedValue({
				id: 'user-123',
				username: 'testuser',
				email: 'test@example.com',
				verified: true,
				userProfile: {
					id: 'profile-123',
					icon: 'https://example.com/icon.jpg',
					backgroundImage: 'https://example.com/background.jpg'
				}
			}
			)

			// Mock do S3 para UserGateway.deleteUserFile
			const mockS3Client = container.resolve('S3Client') as any
			mockS3Client.send.mockResolvedValue({})

			// Act
			const response = await httpClient.delete('/v1/users')

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('message')
		})

		it('should delete user without profile images successfully', async () => {
			// Arrange
			const mockUser = {
				id: TestData.generateUUID(),
				username: 'testuser',
				email: 'test@example.com',
				verified: true,
				userProfile: {
					icon: null,
					backgroundImage: null
				}
			}
			
			// Mock do Prisma
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
			mockPrismaClient.user.delete.mockResolvedValue({
				id: mockUser.id
			})

			// Mock do S3Gateway
			const mockS3Gateway = container.resolve('S3Gateway') as any
			jest.spyOn(mockS3Gateway, 'deleteFile').mockResolvedValue({})

			// Act
			const response = await httpClient.delete('/v1/users')

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('message')
		})

		it('should return UNAUTHORIZED when no token provided', async () => {
			// Arrange
			httpClient.clearAuthToken()

			// Act & Assert
			await expect(httpClient.delete('/v1/users'))
				.rejects.toMatchObject({
					response: {
						status: 401,
						data: {
							message: 'UNAUTHORIZED'
						}
					}
				})
		})

		it('should return USER_NOT_FOUND when user does not exist', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)
			
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockResolvedValue(null)

			// Act & Assert
			await expect(httpClient.delete('/v1/users'))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: {
							message: 'USER_NOT_FOUND'
						}
					}
				})
		})

		it('should handle S3 errors gracefully', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)
			
			const mockUser = {
				id: TestData.generateUUID(),
				username: 'testuser',
				email: 'test@example.com',
				verified: true,
				userProfile: {
					icon: 'https://example.com/icon.jpg',
					backgroundImage: 'https://example.com/background.jpg'
				}
			}
			
			// Mock do Prisma
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
			mockPrismaClient.user.delete.mockResolvedValue({
				id: mockUser.id
			})

			// Mock do S3 para simular erro
			const mockS3Client = container.resolve('S3Client') as any
			mockS3Client.send.mockRejectedValue(new Error('S3 Error'))

			// Act & Assert
			await expect(httpClient.delete('/v1/users'))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)
			
			const mockUser = {
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'test@example.com',
				username: 'testuser',
				verified: true,
				userProfile: {
					icon: null,
					backgroundImage: null
				}
			}
			
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			// Mock para autenticação funcionar
			mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
			// Mock para simular erro no delete
			mockPrismaClient.user.delete.mockRejectedValue(new Error('Database error'))

			// Act & Assert
			await expect(httpClient.delete('/v1/users'))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})

		it('should delete user with all related data', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)
			
			const mockUser = {
				id: TestData.generateUUID(),
				username: 'testuser',
				email: 'test@example.com',
				verified: true,
				userProfile: {
					icon: 'https://example.com/icon.jpg',
					backgroundImage: 'https://example.com/background.jpg'
				}
			}
			
			// Mock do Prisma
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
			mockPrismaClient.user.delete.mockResolvedValue({
				id: mockUser.id
			})

			// Mock do S3 para deletar arquivos
			const mockS3Client = container.resolve('S3Client') as any
			mockS3Client.send.mockResolvedValue({})
			
			// Mock do S3Gateway
			const mockS3Gateway = container.resolve('S3Gateway') as any
			jest.spyOn(mockS3Gateway, 'deleteFile').mockResolvedValue({})

			// Act
			const response = await httpClient.delete('/v1/users')

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('message')
		})
	})
})
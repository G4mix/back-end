import { IntegrationTestSetup } from '@test/setup/integration-test-setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Delete User Integration Tests', () => {
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

	describe('DELETE /api/v1/users', () => {
		it('should delete user successfully', async () => {
			// Arrange
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
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findById: jest.fn().mockResolvedValue(mockUser),
						delete: jest.fn().mockResolvedValue({
							id: mockUser.id
						})
					}
				}
			})

			// Mock do S3 para deletar arquivos
			IntegrationTestSetup.setupMocks({
				s3: {
					send: jest.fn().mockResolvedValue({})
				}
			})

			// Act
			const response = await httpClient.delete('/api/v1/users')

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
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findById: jest.fn().mockResolvedValue(mockUser),
						delete: jest.fn().mockResolvedValue({
							id: mockUser.id
						})
					}
				}
			})

			// Act
			const response = await httpClient.delete('/api/v1/users')

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('message')
		})

		it('should return UNAUTHORIZED when no token provided', async () => {
			// Arrange
			httpClient.clearAuthToken()

			// Act & Assert
			await expect(httpClient.delete('/api/v1/users'))
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
			// Mock do Prisma para retornar null
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findById: jest.fn().mockResolvedValue(null)
					}
				}
			})

			// Act & Assert
			await expect(httpClient.delete('/api/v1/users'))
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
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findById: jest.fn().mockResolvedValue(mockUser),
						delete: jest.fn().mockResolvedValue({
							id: mockUser.id
						})
					}
				}
			})

			// Mock do S3 para retornar erro
			IntegrationTestSetup.setupMocks({
				s3: {
					send: jest.fn().mockRejectedValue(new Error('S3 service unavailable'))
				}
			})

			// Act & Assert
			await expect(httpClient.delete('/api/v1/users'))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findById: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.delete('/api/v1/users'))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})

		it('should delete user with all related data', async () => {
			// Arrange
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
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findById: jest.fn().mockResolvedValue(mockUser),
						delete: jest.fn().mockResolvedValue({
							id: mockUser.id
						})
					}
				}
			})

			// Mock do S3
			IntegrationTestSetup.setupMocks({
				s3: {
					send: jest.fn().mockResolvedValue({})
				}
			})

			// Act
			const response = await httpClient.delete('/api/v1/users')

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('message')
		})
	})
})

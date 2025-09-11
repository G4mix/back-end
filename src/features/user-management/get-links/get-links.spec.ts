import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Get Links Integration Tests', () => {
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

	describe('GET /v1/users/links', () => {
		it('should get personal links successfully', async () => {
			// Arrange
			const mockLinks = [
				{
					id: TestData.generateUUID(),
					url: 'https://github.com/testuser',
					userId: TestData.generateUUID(),
					created_at: new Date()
				},
				{
					id: TestData.generateUUID(),
					url: 'https://linkedin.com/in/testuser',
					userId: TestData.generateUUID(),
					created_at: new Date()
				},
				{
					id: TestData.generateUUID(),
					url: 'https://twitter.com/testuser',
					userId: TestData.generateUUID(),
					created_at: new Date()
				}
			]

			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					link: {
						findMany: jest.fn().mockResolvedValue(mockLinks)
					}
				}
			})

			// Act
			const response = await httpClient.get('/v1/users/links')

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('links')
			expect(response.data.links).toHaveLength(3)
			expect(response.data.links[0].url).toBe('https://github.com/testuser')
			expect(response.data.links[1].url).toBe('https://linkedin.com/in/testuser')
			expect(response.data.links[2].url).toBe('https://twitter.com/testuser')
		})

		it('should return empty array when no links found', async () => {
			// Arrange
			// Mock do Prisma para retornar array vazio
			IntegrationTestSetup.setupMocks({
				prisma: {
					link: {
						findMany: jest.fn().mockResolvedValue([])
					}
				}
			})

			// Act
			const response = await httpClient.get('/v1/users/links')

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.links).toHaveLength(0)
		})

		it('should return UNAUTHORIZED when no token provided', async () => {
			// Arrange
			httpClient.clearAuthToken()

			// Act & Assert
			await expect(httpClient.get('/v1/users/links'))
				.rejects.toMatchObject({
					response: {
						status: 401,
						data: {
							message: 'UNAUTHORIZED'
						}
					}
				})
		})

		it('should get links sorted by creation date', async () => {
			// Arrange
			const mockLinks = [
				{
					id: TestData.generateUUID(),
					url: 'https://github.com/testuser',
					userId: TestData.generateUUID(),
					created_at: new Date('2024-01-02')
				},
				{
					id: TestData.generateUUID(),
					url: 'https://linkedin.com/in/testuser',
					userId: TestData.generateUUID(),
					created_at: new Date('2024-01-01')
				}
			]

			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					link: {
						findMany: jest.fn().mockResolvedValue(mockLinks)
					}
				}
			})

			// Act
			const response = await httpClient.get('/v1/users/links')

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.links).toHaveLength(2)
			expect(response.data.links[0].url).toBe('https://github.com/testuser')
			expect(response.data.links[1].url).toBe('https://linkedin.com/in/testuser')
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					link: {
						findMany: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.get('/v1/users/links'))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

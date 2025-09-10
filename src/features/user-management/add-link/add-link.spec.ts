import { IntegrationTestSetup } from '@test/setup/integration-test-setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Add Link Integration Tests', () => {
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

	describe('POST /api/v1/users/links', () => {
		it('should add personal link successfully with valid URL', async () => {
			// Arrange
			const linkData = TestData.createPersonalLink()
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					link: {
						create: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							url: linkData.url,
							userId: TestData.generateUUID(),
							created_at: new Date()
						})
					}
				}
			})

			// Act
			const response = await httpClient.post('/api/v1/users/links', linkData)

			// Assert
			expect(response.status).toBe(201)
			expect(response.data).toHaveProperty('link')
			expect(response.data.link.url).toBe(linkData.url)
		})

		it('should return validation error for invalid URL format', async () => {
			// Arrange
			const linkData = TestData.createPersonalLink({ url: 'invalid-url' })

			// Act & Assert
			await expect(httpClient.post('/api/v1/users/links', linkData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_URL'
						}
					}
				})
		})

		it('should return validation error for URL without http', async () => {
			// Arrange
			const linkData = TestData.createPersonalLink({ url: 'example.com' })

			// Act & Assert
			await expect(httpClient.post('/api/v1/users/links', linkData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'URL_MUST_START_WITH_HTTP'
						}
					}
				})
		})

		it('should return validation error for URL without https', async () => {
			// Arrange
			const linkData = TestData.createPersonalLink({ url: 'http://example.com' })

			// Act & Assert
			await expect(httpClient.post('/api/v1/users/links', linkData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'URL_MUST_START_WITH_HTTP'
						}
					}
				})
		})

		it('should return validation error for long URL', async () => {
			// Arrange
			const linkData = TestData.createPersonalLink({ 
				url: 'https://example.com/' + 'a'.repeat(700)
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/users/links', linkData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'URL_TOO_LONG'
						}
					}
				})
		})

		it('should return UNAUTHORIZED when no token provided', async () => {
			// Arrange
			const linkData = TestData.createPersonalLink()
			httpClient.clearAuthToken()

			// Act & Assert
			await expect(httpClient.post('/api/v1/users/links', linkData))
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
			const linkData = TestData.createPersonalLink()
			
			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					link: {
						create: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/api/v1/users/links', linkData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})

		it('should accept various valid URL formats', async () => {
			// Arrange
			const validUrls = [
				'https://github.com/user',
				'https://linkedin.com/in/user',
				'https://twitter.com/user',
				'https://example.com/path?query=value',
				'https://subdomain.example.com'
			]

			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					link: {
						create: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							url: '',
							userId: TestData.generateUUID(),
							created_at: new Date()
						})
					}
				}
			})

			// Act & Assert
			for (const url of validUrls) {
				const linkData = TestData.createPersonalLink({ url })
				const response = await httpClient.post('/api/v1/users/links', linkData)
				expect(response.status).toBe(201)
			}
		})
	})
})

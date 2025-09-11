import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { container } from 'tsyringe'

describe('Signup Integration Tests', () => {
	let httpClient: HttpClient
	let baseUrl: string

	beforeAll(async () => {
		// Usa o servidor global
		baseUrl = IntegrationTestSetup.getBaseUrl()
		httpClient = new HttpClient(baseUrl)
	})

	beforeEach(() => {
		// Limpa mocks antes de cada teste
		IntegrationTestSetup.clearMocks()
	})

	describe('POST /v1/auth/signup', () => {
		it('should create user successfully with valid data', async () => {
			// Arrange
			const userData = {
				username: 'testuser',
				email: 'test@example.com',
				password: 'TestPassword123!'
			}

			// Mock do Prisma
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique
				.mockResolvedValueOnce(null) // Email não existe
				.mockResolvedValueOnce(null) // Username não existe
			mockPrismaClient.user.create.mockResolvedValue({
				id: 'user-123',
				username: userData.username,
				email: userData.email,
				verified: false,
				created_at: new Date(),
				updated_at: new Date(),
				userProfile: {
					id: 'profile-123',
					displayName: null,
					autobiography: null,
					icon: null,
					backgroundImage: null,
					links: [],
					_count: {
						followers: 0,
						following: 0
					}
				}
			})

			// Mock do SES
			const mockSESClient = container.resolve('SESClient') as any
			mockSESClient.send.mockResolvedValue({})

			// Act
			const response = await httpClient.post('/v1/auth/signup', userData)

			// Assert
			expect(response.status).toBe(201)
			expect(response.data).toHaveProperty('accessToken')
			expect(response.data).toHaveProperty('refreshToken')
			expect(response.data).toHaveProperty('user')
			expect(response.data.user.email).toBe(userData.email)
			expect(response.data.user.username).toBe(userData.username)
		})

		it('should return validation error for invalid email format', async () => {
			// Arrange
			const userData = {
				username: 'testuser',
				email: 'invalid-email',
				password: 'TestPassword123!'
			}

			// Act & Assert
			await expect(httpClient.post('/v1/auth/signup', userData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_EMAIL'
						}
					}
				})
		})

		it('should return validation error for weak password', async () => {
			// Arrange
			const userData = {
				username: 'testuser',
				email: 'test@example.com',
				password: '123'
			}

			// Act & Assert
			await expect(httpClient.post('/v1/auth/signup', userData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_PASSWORD'
						}
					}
				})
		})

		it('should return validation error for short username', async () => {
			// Arrange
			const userData = {
				username: 'ab',
				email: 'test@example.com',
				password: 'TestPassword123!'
			}

			// Act & Assert
			await expect(httpClient.post('/v1/auth/signup', userData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_NAME'
						}
					}
				})
		})
	})
})
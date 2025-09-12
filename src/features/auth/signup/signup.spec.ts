import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { container } from 'tsyringe'
import { generateRandomPassword } from '@shared/utils/generate-random-password'

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
			const randomPassword = generateRandomPassword(20)
			// Arrange
			const userData = {
				username: 'testuser',
				email: 'test@example.com',
				password: randomPassword
			}

			// Mock do Prisma
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
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
			console.log(response.data)
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
				password: generateRandomPassword()
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

		it('should return USER_ALREADY_EXISTS when user already exists', async () => {
			// Arrange
			const userData = {
				username: 'existinguser',
				email: 'existing@example.com',
				password: 'TestPassword123!'
			}

			// Mock do UserRepository para retornar usuário existente
			const mockUserRepository = container.resolve('UserRepository') as any
			mockUserRepository.findByEmail.mockResolvedValue({
				id: 'existing-user-123',
				username: 'existinguser',
				email: 'existing@example.com',
				verified: false,
				created_at: new Date(),
				updated_at: new Date(),
				userProfile: {
					id: 'profile-existing-123',
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

			// Act & Assert
			await expect(httpClient.post('/v1/auth/signup', userData))
				.rejects.toMatchObject({
					response: {
						status: 409,
						data: {
							message: 'USER_ALREADY_EXISTS'
						}
					}
				})
		})

		it('should return error when email verification fails', async () => {
			// Arrange
			const userData = {
				username: 'newuser',
				email: 'unverified@example.com',
				password: 'TestPassword123!'
			}

			// Mock do PostgresqlClient para retornar null (usuário não existe)
			const { container } = require('tsyringe')
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			mockPrismaClient.user.findUnique.mockResolvedValue(null)

			// Mock do SESClient para retornar erro
			const mockSESClient = container.resolve('SESClient') as any
			mockSESClient.send.mockRejectedValue(new Error('SES verification failed'))

			// Act & Assert
			await expect(httpClient.post('/v1/auth/signup', userData))
				.rejects.toMatchObject({
					response: {
						status: 500,
						data: {
							message: 'ERROR_WHILE_VERIFYING_EMAIL'
						}
					}
				})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const userData = {
				username: 'testuser',
				email: 'test@example.com',
				password: 'TestPassword123!'
			}

			// Mock do Prisma para simular erro de banco
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockRejectedValue(new Error('Database connection error'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/v1/auth/signup', userData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})
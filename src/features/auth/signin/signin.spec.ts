import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { container } from 'tsyringe'
import { BCryptEncoder } from '@shared/utils/bcrypt-encoder'

describe('Signin Integration Tests', () => {
	let httpClient: HttpClient
	let baseUrl: string

	beforeAll(async () => {
		// Usa o servidor global já iniciado
		baseUrl = IntegrationTestSetup.getBaseUrl()
		httpClient = new HttpClient(baseUrl)
	})

	describe('POST /v1/auth/signin', () => {
		it('should signin user successfully with valid credentials', async () => {
			// Arrange
			const signinData = {
				email: 'test@example.com',
				password: 'ValidPassword123!'
			}
			
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			mockPrismaClient.user.findUnique.mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'test@example.com',
				username: 'testuser',
				password: BCryptEncoder.encode('ValidPassword123!'), // Hash mockado
				verified: true,
				loginAttempts: 0,
				blockedUntil: null,
				created_at: new Date(),
				updated_at: new Date(),
				userProfile: {
					id: 'profile-123',
					user_id: 'user-123',
					name: 'Test User',
					displayName: 'Test User',
					bio: 'Test bio',
					backgroundImage: null,
					created_at: new Date(),
					updated_at: new Date(),
					links: [],
					_count: {
						following: 0,
						followers: 0
					}
				},
				userCode: null
			})
			console.log('✅ Prisma mock configured')

			// Act
			try {
				console.log('🚀 Making request to /v1/auth/signin...')
				const response = await httpClient.post('/v1/auth/signin', signinData)

				// Debug
				console.log('✅ Response status:', response.status)
				console.log('✅ Response body:', response.data)

				// Assert
				expect(response.status).toBe(200)
				expect(response.data).toHaveProperty('accessToken')
				expect(response.data).toHaveProperty('refreshToken')
				expect(response.data).toHaveProperty('user')
			} catch (error: any) {
				console.log('❌ Error details:')
				console.log('  Status:', error.response?.status)
				console.log('  Data:', error.response?.data)
				console.log('  Message:', error.message)
				throw error
			}
		})

		it('should return validation error for invalid email format', async () => {
			// Arrange
			const signinData = {
				email: 'invalid-email',
				password: 'ValidPassword123!'
			}

			// Act & Assert
			await expect(httpClient.post('/v1/auth/signin', signinData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_EMAIL'
						}
					}
				})
		})

		it('should return validation error for empty email', async () => {
			// Arrange
			const signinData = {
				email: '',
				password: 'ValidPassword123!'
			}

			// Act & Assert
			await expect(httpClient.post('/v1/auth/signin', signinData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_EMAIL'
						}
					}
				})
		})

		it('should return validation error for empty password', async () => {
			// Arrange
			const signinData = {
				email: 'test@example.com',
				password: ''
			}

			// Act & Assert
			await expect(httpClient.post('/v1/auth/signin', signinData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'PASSWORD_REQUIRED'
						}
					}
				})
		})

		it('should return USER_NOT_FOUND when user does not exist', async () => {
			// Arrange
			const signinData = {
				email: 'nonexistent@example.com',
				password: 'ValidPassword123!'
			}

			// Mock do Prisma para retornar null (usuário não encontrado)
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue(null)
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/v1/auth/signin', signinData))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: { message: 'USER_NOT_FOUND' }
					}
				})
		})

		it('should return WRONG_PASSWORD_ONCE when password is wrong', async () => {
			// Arrange
			const signinData = {
				email: 'test@example.com',
				password: 'WrongPassword123!'
			}

			// Mock do Prisma para retornar usuário com senha diferente
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue({
							id: 'user-123',
							userProfileId: 'profile-123',
							email: 'test@example.com',
							username: 'testuser',
							password: '$2b$10$different.hash', // Hash diferente
							verified: true,
							loginAttempts: 0,
							blockedUntil: null,
							created_at: new Date(),
							updated_at: new Date(),
							userProfile: {
								id: 'profile-123',
								user_id: 'user-123',
								name: 'Test User',
								displayName: 'Test User',
								bio: 'Test bio',
								backgroundImage: null,
								created_at: new Date(),
								updated_at: new Date(),
								links: [],
								_count: {
									following: 0,
									followers: 0
								}
							},
							userCode: null
						})
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/v1/auth/signin', signinData))
				.rejects.toMatchObject({
					response: {
						status: 401,
						data: { message: 'WRONG_PASSWORD_ONCE' }
					}
				})
		})

		it('should signin unverified user successfully (auto-verification)', async () => {
			// Arrange
			const signinData = {
				email: 'unverified@example.com',
				password: 'ValidPassword123!'
			}

			// Mock do Prisma para retornar usuário não verificado
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			const mockSESClient = container.resolve('SESClient') as any
			
			mockPrismaClient.user.findUnique.mockResolvedValue({
				id: 'user-456',
				userProfileId: 'profile-456',
				email: 'unverified@example.com',
				username: 'unverifieduser',
				password: BCryptEncoder.encode('ValidPassword123!'), // Hash válido
				verified: false, // Usuário não verificado
				loginAttempts: 0,
				blockedUntil: null,
				created_at: new Date(),
				updated_at: new Date(),
				userProfile: {
					id: 'profile-456',
					user_id: 'user-456',
					name: 'Unverified User',
					displayName: 'Unverified User',
					bio: 'Test bio',
					backgroundImage: null,
					created_at: new Date(),
					updated_at: new Date(),
					links: [],
					_count: {
						following: 0,
						followers: 0
					}
				},
				userCode: null
			})
			
			// Mock do update para retornar usuário verificado
			mockPrismaClient.user.update.mockResolvedValue({
				id: 'user-456',
				userProfileId: 'profile-456',
				email: 'unverified@example.com',
				username: 'unverifieduser',
				password: BCryptEncoder.encode('ValidPassword123!'),
				verified: true, // Será verificado automaticamente
				loginAttempts: 0,
				blockedUntil: null,
				created_at: new Date(),
				updated_at: new Date(),
				userProfile: {
					id: 'profile-456',
					user_id: 'user-456',
					name: 'Unverified User',
					displayName: 'Unverified User',
					bio: 'Test bio',
					backgroundImage: null,
					created_at: new Date(),
					updated_at: new Date(),
					links: [],
					_count: {
						following: 0,
						followers: 0
					}
				},
				userCode: null
			})
			
			// Mock do SES para simular verificação de email bem-sucedida
			mockSESClient.send
				.mockResolvedValueOnce({ // Para checkEmailStatus
					VerificationAttributes: {
						'unverified@example.com': {
							VerificationStatus: 'Success'
						}
					}
				})
				.mockResolvedValueOnce({ // Para sendEmail
					MessageId: 'test-message-id'
				})

			// Act
			const response = await httpClient.post('/v1/auth/signin', signinData)

			// Debug
			console.log('Response status:', response.status)
			console.log('Response body:', response.data)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('accessToken')
			expect(response.data).toHaveProperty('refreshToken')
			expect(response.data).toHaveProperty('user')
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const signinData = {
				email: 'test@example.com',
				password: 'ValidPassword123!'
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
			await expect(httpClient.post('/v1/auth/signin', signinData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})
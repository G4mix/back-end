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

		it('should return EXCESSIVE_LOGIN_ATTEMPTS when user is blocked by time', async () => {
			// Arrange
			const signinData = {
				email: 'blocked@example.com',
				password: 'ValidPassword123!'
			}

			// Mock do Prisma para retornar usuário bloqueado por tempo
			const futureDate = new Date()
			futureDate.setMinutes(futureDate.getMinutes() + 30) // Bloqueado por mais 30 minutos

			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue({
							id: 'user-blocked',
							userProfileId: 'profile-blocked',
							email: 'blocked@example.com',
							username: 'blockeduser',
							password: BCryptEncoder.encode('ValidPassword123!'),
							verified: true,
							loginAttempts: 5, // Mais de 5 tentativas
							blockedUntil: futureDate, // Bloqueado por tempo
							created_at: new Date(),
							updated_at: new Date(),
							userProfile: {
								id: 'profile-blocked',
								user_id: 'user-blocked',
								name: 'Blocked User',
								displayName: 'Blocked User',
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
						status: 429,
						data: { message: 'EXCESSIVE_LOGIN_ATTEMPTS' }
					}
				})
		})

		it('should reset login attempts when more than 5 attempts but not blocked by time', async () => {
			// Arrange
			const signinData = {
				email: 'reset@example.com',
				password: 'ValidPassword123!'
			}

			// Mock do Prisma para retornar usuário com mais de 5 tentativas mas não bloqueado por tempo
			const pastDate = new Date()
			pastDate.setMinutes(pastDate.getMinutes() - 30) // Bloqueio expirado

			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			mockPrismaClient.user.findUnique.mockResolvedValue({
				id: 'user-reset',
				userProfileId: 'profile-reset',
				email: 'reset@example.com',
				username: 'resetuser',
				password: BCryptEncoder.encode('ValidPassword123!'),
				verified: true,
				loginAttempts: 6, // Mais de 5 tentativas
				blockedUntil: pastDate, // Bloqueio expirado
				created_at: new Date(),
				updated_at: new Date(),
				userProfile: {
					id: 'profile-reset',
					user_id: 'user-reset',
					name: 'Reset User',
					displayName: 'Reset User',
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

			// Mock do update para resetar tentativas
			mockPrismaClient.user.update.mockResolvedValue({
				id: 'user-reset',
				userProfileId: 'profile-reset',
				email: 'reset@example.com',
				username: 'resetuser',
				password: BCryptEncoder.encode('ValidPassword123!'),
				verified: true,
				loginAttempts: 0, // Resetado
				blockedUntil: null,
				created_at: new Date(),
				updated_at: new Date(),
				userProfile: {
					id: 'profile-reset',
					user_id: 'user-reset',
					name: 'Reset User',
					displayName: 'Reset User',
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

			// Act
			const response = await httpClient.post('/v1/auth/signin', signinData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('accessToken')
			expect(response.data).toHaveProperty('refreshToken')
			expect(response.data).toHaveProperty('user')
			
			// Verificar se o update foi chamado para resetar as tentativas
			expect(mockPrismaClient.user.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: 'user-reset' },
					data: expect.objectContaining({
						loginAttempts: 0
					})
				})
			)
		})

		it('should block user after 5 failed attempts', async () => {
			// Arrange
			const signinData = {
				email: 'blocking@example.com',
				password: 'WrongPassword123!'
			}

			// Mock do Prisma para retornar usuário com 4 tentativas (próxima será a 5ª)
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			mockPrismaClient.user.findUnique.mockResolvedValue({
				id: 'user-blocking',
				userProfileId: 'profile-blocking',
				email: 'blocking@example.com',
				username: 'blockinguser',
				password: BCryptEncoder.encode('ValidPassword123!'), // Senha diferente
				verified: true,
				loginAttempts: 4, // 4 tentativas, próxima será a 5ª
				blockedUntil: null,
				created_at: new Date(),
				updated_at: new Date(),
				userProfile: {
					id: 'profile-blocking',
					user_id: 'user-blocking',
					name: 'Blocking User',
					displayName: 'Blocking User',
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

			// Mock do update para simular o bloqueio
			mockPrismaClient.user.update.mockResolvedValue({
				id: 'user-blocking',
				userProfileId: 'profile-blocking',
				email: 'blocking@example.com',
				username: 'blockinguser',
				password: BCryptEncoder.encode('ValidPassword123!'),
				verified: true,
				loginAttempts: 5, // 5 tentativas
				blockedUntil: expect.any(Date), // Bloqueado
				created_at: new Date(),
				updated_at: new Date(),
				userProfile: {
					id: 'profile-blocking',
					user_id: 'user-blocking',
					name: 'Blocking User',
					displayName: 'Blocking User',
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

			// Act & Assert
			await expect(httpClient.post('/v1/auth/signin', signinData))
				.rejects.toMatchObject({
					response: {
						status: 401,
						data: { message: 'WRONG_PASSWORD_FIVE_TIMES' }
					}
				})

			// Verificar se o update foi chamado com blockedUntil
			expect(mockPrismaClient.user.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: 'user-blocking' },
					data: expect.objectContaining({
						loginAttempts: 5,
						email: 'blocking@example.com',
						blockedUntil: expect.any(Date)
					})
				})
			)
		})

		it('should handle unverified user without auto-verification', async () => {
			// Arrange
			const signinData = {
				email: 'unverified-no-auto@example.com',
				password: 'ValidPassword123!'
			}

			// Mock do Prisma para retornar usuário não verificado
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			const mockSESClient = container.resolve('SESClient') as any
			
			mockPrismaClient.user.findUnique.mockResolvedValue({
				id: 'user-unverified-no-auto',
				userProfileId: 'profile-unverified-no-auto',
				email: 'unverified-no-auto@example.com',
				username: 'unverifiednoauto',
				password: BCryptEncoder.encode('ValidPassword123!'),
				verified: false, // Usuário não verificado
				loginAttempts: 0,
				blockedUntil: null,
				created_at: new Date(),
				updated_at: new Date(),
				userProfile: {
					id: 'profile-unverified-no-auto',
					user_id: 'user-unverified-no-auto',
					name: 'Unverified No Auto User',
					displayName: 'Unverified No Auto User',
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
			
			// Mock do SES para simular verificação de email falhada (não verificado)
			mockSESClient.send.mockResolvedValue({
				VerificationAttributes: {
					'unverified-no-auto@example.com': {
						VerificationStatus: 'Pending' // Não verificado
					}
				}
			})

			// Act
			const response = await httpClient.post('/v1/auth/signin', signinData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('accessToken')
			expect(response.data).toHaveProperty('refreshToken')
			expect(response.data).toHaveProperty('user')
			
			// Verificar se o SES foi chamado para verificar o status
			expect(mockSESClient.send).toHaveBeenCalled()
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
import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Change Password Integration Tests', () => {
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

	describe('POST /v1/auth/change-password', () => {
		it('should change password successfully with limited JWT from verify-email-code', async () => {
			// Arrange - Simula o fluxo completo de recuperação de senha
			const userDataInput = TestData.createUser()
			const userId = TestData.generateUUID()
			const userProfileId = TestData.generateUUID()
			const userData = {
				id: userId,
				username: userDataInput.username,
				email: userDataInput.email,
				password: '$2b$10$hashedpassword', // Senha atual hasheada
				verified: false,
				created_at: new Date(),
				updated_at: new Date(),
				userProfileId: userProfileId,
				loginAttempts: 0,
				blockedUntil: null,
				userProfile: {
					id: userProfileId,
					name: null,
					bio: null,
					icon: null,
					created_at: new Date(),
					updated_at: new Date()
				},
				userCode: {
					id: TestData.generateUUID(),
					code: '123456',
					updated_at: new Date() // Código válido (não expirado)
				}
			}

			const changePasswordData = TestData.createChangePasswordData()
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockImplementation(({ where }) => {
							if (where.email === userDataInput.email) {
								return Promise.resolve(userData)
							}
							if (where.id === userId) {
								return Promise.resolve(userData)
							}
							return Promise.resolve(null)
						}),
						update: jest.fn().mockResolvedValue({
							...userData,
							password: '$2b$10$newhashedpassword',
							verified: true
						})
					}
				}
			})

			// Step 1: Verify email code and get limited JWT
			const verifyData = TestData.createVerifyEmailCodeData()
			const verifyResponse = await httpClient.post('/v1/auth/verify-email-code', verifyData)
			expect(verifyResponse.status).toBe(200)
			expect(verifyResponse.data).toHaveProperty('accessToken')

			// Step 2: Use limited JWT to change password
			const limitedToken = verifyResponse.data.accessToken
			httpClient.setAuthToken(limitedToken)

			// Act
			const response = await httpClient.post('/v1/auth/change-password', changePasswordData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('accessToken')
			expect(response.data).toHaveProperty('refreshToken')
			expect(response.data).toHaveProperty('user')
		})

		it('should return validation error for empty new password', async () => {
			// Arrange
			const changePasswordData = {
				newPassword: ''
			}

			// Act & Assert
			await expect(httpClient.post('/v1/auth/change-password', changePasswordData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_PASSWORD'
						}
					}
				})
		})

		it('should return validation error for weak new password', async () => {
			// Arrange
			const changePasswordData = {
				newPassword: 'weak'
			}

			// Act & Assert
			await expect(httpClient.post('/v1/auth/change-password', changePasswordData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_PASSWORD'
						}
					}
				})
		})

		it('should return validation error for new password too short', async () => {
			// Arrange
			const changePasswordData = {
				newPassword: '123'
			}

			// Act & Assert
			await expect(httpClient.post('/v1/auth/change-password', changePasswordData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_PASSWORD'
						}
					}
				})
		})

		it('should return validation error for new password without uppercase', async () => {
			// Arrange
			const changePasswordData = {
				newPassword: 'newpassword123!'
			}

			// Act & Assert
			await expect(httpClient.post('/v1/auth/change-password', changePasswordData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_PASSWORD'
						}
					}
				})
		})

		it('should return validation error for new password without special character', async () => {
			// Arrange
			const changePasswordData = {
				newPassword: 'NewPassword123'
			}

			// Act & Assert
			await expect(httpClient.post('/v1/auth/change-password', changePasswordData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_PASSWORD'
						}
					}
				})
		})

		it('should return UNAUTHORIZED when no token provided', async () => {
			// Arrange
			const changePasswordData = {
				newPassword: 'NewPassword123!'
			}
			httpClient.clearAuthToken()

			// Act & Assert
			await expect(httpClient.post('/v1/auth/change-password', changePasswordData))
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
			const userId = TestData.generateUUID()
			const userProfileId = TestData.generateUUID()
			
			// Gera um JWT limitado válido
			const { JwtManager } = await import('@shared/utils/jwt-manager')
			const limitedToken = JwtManager.generateToken({
				sub: userId,
				userProfileId: userProfileId,
				validRoutes: [{ route: '/auth/change-password', method: 'POST' }]
			})
			httpClient.setAuthToken(limitedToken)

			const changePasswordData = {
				newPassword: 'NewPassword123!'
			}

			// Mock do Prisma para retornar null
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue(null)
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/v1/auth/change-password', changePasswordData))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: {
							message: 'USER_NOT_FOUND'
						}
					}
				})
		})


		it('should handle database errors gracefully', async () => {
			// Arrange
			const userId = TestData.generateUUID()
			const userProfileId = TestData.generateUUID()
			
			// Gera um JWT limitado válido
			const { JwtManager } = await import('@shared/utils/jwt-manager')
			const limitedToken = JwtManager.generateToken({
				sub: userId,
				userProfileId: userProfileId,
				validRoutes: [{ route: '/auth/change-password', method: 'POST' }]
			})
			httpClient.setAuthToken(limitedToken)

			const changePasswordData = {
				newPassword: 'NewPassword123!'
			}

			// Mock do Prisma para retornar erro
			let callCount = 0
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockImplementation(({ where }) => {
							if (where.id === userId) {
								// Primeira chamada (middleware de segurança) retorna usuário válido
								// Segunda chamada (controller) retorna erro
								if (callCount === 0) {
									callCount = 1
									return Promise.resolve({
										id: userId,
										username: 'testuser',
										email: 'test@example.com',
										verified: true,
										created_at: new Date(),
										updated_at: new Date(),
										userProfileId: userProfileId,
										loginAttempts: 0,
										blockedUntil: null,
										userProfile: {
											id: userProfileId,
											name: null,
											bio: null,
											icon: null,
											created_at: new Date(),
											updated_at: new Date()
										}
									})
								} else {
									return Promise.reject(new Error('Database connection failed'))
								}
							}
							return Promise.resolve(null)
						})
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/v1/auth/change-password', changePasswordData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

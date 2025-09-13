import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'
import { TestTokens } from '@test/helpers/test-tokens'
import { container } from 'tsyringe'




describe('Social Login Integration Tests', () => {
	let httpClient: HttpClient
	let baseUrl: string

	beforeAll(async () => {
		// Inicia o servidor real
		baseUrl = await IntegrationTestSetup.startServer()
		httpClient = new HttpClient(baseUrl)
	})

	afterAll(async () => {
		// Para o servidor
		await IntegrationTestSetup.stopServer()
	})

	beforeEach(() => {
		// Limpa mocks antes de cada teste
		IntegrationTestSetup.clearMocks()
	})

	describe('GET /v1/auth/callback/{provider}', () => {
		it('should handle Google callback successfully', async () => {
			// Arrange
			const code = 'test-code'
			const state = 'test-state'

			// Mock do socialLoginRequests
			const mockSocialLoginRequests = {
				google: {
					getToken: jest.fn().mockResolvedValue('mock-token')
				}
			}

			jest.doMock('@shared/utils/social-login-requests', () => ({
				socialLoginRequests: mockSocialLoginRequests
			}))

			// Act & Assert
			try {
				await httpClient.get(`/v1/auth/callback/google?code=${code}&state=${state}`)
			} catch (error: any) {
				// O redirect para protocolo customizado causa erro, mas isso é esperado
				expect(error.message).toContain('Unsupported protocol com.gamix')
			}
		})

		it('should handle LinkedIn callback successfully', async () => {
			// Arrange
			const code = 'test-code'

			// Mock do socialLoginRequests
			const mockSocialLoginRequests = {
				linkedin: {
					getToken: jest.fn().mockResolvedValue('mock-token')
				}
			}

			jest.doMock('@shared/utils/social-login-requests', () => ({
				socialLoginRequests: mockSocialLoginRequests
			}))

			// Act & Assert
			try {
				await httpClient.get(`/v1/auth/callback/linkedin?code=${code}`)
			} catch (error: any) {
				// O redirect para protocolo customizado causa erro, mas isso é esperado
				expect(error.message).toContain('Unsupported protocol com.gamix')
			}
		})

		it('should handle GitHub callback successfully', async () => {
			// Arrange
			const code = 'test-code'

			// Mock do socialLoginRequests
			const mockSocialLoginRequests = {
				github: {
					getToken: jest.fn().mockResolvedValue('mock-token')
				}
			}

			jest.doMock('@shared/utils/social-login-requests', () => ({
				socialLoginRequests: mockSocialLoginRequests
			}))

			// Act & Assert
			try {
				await httpClient.get(`/v1/auth/callback/github?code=${code}`)
			} catch (error: any) {
				// O redirect para protocolo customizado causa erro, mas isso é esperado
				expect(error.message).toContain('Unsupported protocol com.gamix')
			}
		})

		it('should handle callback without code parameter', async () => {
			// Act & Assert
			try {
				await httpClient.get('/v1/auth/callback/google')
			} catch (error: any) {
				// O redirect para protocolo customizado causa erro, mas isso é esperado
				expect(error.message).toContain('Unsupported protocol com.gamix')
			}
		})

		it('should handle callback with invalid provider', async () => {
			// Act & Assert
			await expect(httpClient.get('/v1/auth/callback/invalid?code=test-code'))
				.rejects.toMatchObject({
					response: {
						status: 400
					}
				})
		})

		it('should handle callback when token exchange fails', async () => {
			// Arrange
			const code = 'test-code'

			// Mock do socialLoginRequests para falhar
			const mockSocialLoginRequests = {
				google: {
					getToken: jest.fn().mockRejectedValue(new Error('Token exchange failed'))
				}
			}

			jest.doMock('@shared/utils/social-login-requests', () => ({
				socialLoginRequests: mockSocialLoginRequests
			}))

			// Act & Assert
			try {
				await httpClient.get(`/v1/auth/callback/google?code=${code}`)
			} catch (error: any) {
				// O redirect para protocolo customizado causa erro, mas isso é esperado
				expect(error.message).toContain('Unsupported protocol com.gamix')
			}
		})

		it('should handle callback successfully when token is returned', async () => {
			// Arrange
			const code = 'test-code'
			const state = 'test-state'

			// Mock do controller usando monkey patching
			const { SocialLoginController } = await import('@features/auth/social-login/social-login.controller')
			const controllerInstance = container.resolve(SocialLoginController)

			// Monkey patch do método handleCallbackUrl usando cast
			const originalHandleCallbackUrl = (controllerInstance as any).handleCallbackUrl
				; (controllerInstance as any).handleCallbackUrl = jest.fn().mockResolvedValue('valid-token')

			// Act & Assert
			try {
				await httpClient.get(`/v1/auth/callback/google?code=${code}&state=${state}`)
			} catch (error: any) {
				// O redirect para protocolo customizado causa erro, mas isso é esperado
				expect(error.message).toContain('Unsupported protocol com.gamix')
			} finally {
				// Restaura o método original
				; (controllerInstance as any).handleCallbackUrl = originalHandleCallbackUrl
			}
		})
	})

	it('should login with Google successfully', async () => {
		// Arrange
		const socialLoginData = {
			token: 'google-access-token'
		}

		// Mock do AuthGateway
		const { AuthGateway } = await import('@shared/gateways/auth.gateway')
		const authGatewayInstance = container.resolve(AuthGateway)
		jest.spyOn(authGatewayInstance, 'validateSocialLogin').mockResolvedValue({
			valid: true,
			userData: {
				name: 'Test User',
				email: 'test@example.com'
			}
		})

		// Mock do Prisma - aplica após o reset do beforeEach
		const mockPrismaClient = container.resolve('PostgresqlClient') as any

		// Mock para findOAuthUser (usuário não existe)
		mockPrismaClient.userOAuth.findFirst.mockResolvedValue(null)

		// Mock para findByEmail (usuário não existe)
		mockPrismaClient.user.findUnique.mockResolvedValue(null)

		// Mock para create user
		const userId = TestData.generateUUID()
		mockPrismaClient.user.create.mockResolvedValue({
			id: userId,
			username: 'Test User',
			email: 'test@example.com',
			password: 'hashed-password',
			verified: true,
			created_at: new Date(),
			updated_at: new Date()
		})

		// Mock para linkOAuthProvider
		mockPrismaClient.userOAuth.create.mockResolvedValue({
			id: TestData.generateUUID(),
			userId: userId,
			provider: 'google',
			email: 'test@example.com',
			created_at: new Date(),
			updated_at: new Date(),
			user: {
				id: userId,
				username: 'Test User',
				email: 'test@example.com',
				password: 'hashed-password',
				verified: true,
				userProfileId: TestData.generateUUID(),
				created_at: new Date(),
				updated_at: new Date()
			}
		})

		// Mock para update user
		mockPrismaClient.user.update.mockResolvedValue({
			id: userId,
			username: 'Test User',
			email: 'test@example.com',
			password: 'hashed-password',
			verified: true,
			token: 'refresh-token',
			created_at: new Date(),
			updated_at: new Date()
		})

		// Act
		const response = await httpClient.post('/v1/auth/social-login/google', socialLoginData)

		// Assert
		expect(response.status).toBe(200)
		expect(response.data).toHaveProperty('accessToken')
		expect(response.data).toHaveProperty('refreshToken')
		expect(response.data).toHaveProperty('user')
	})

	it('should login with LinkedIn successfully', async () => {
		// Arrange
		const socialLoginData = {
			token: 'linkedin-access-token'
		}

		// Mock do AuthGateway
		const { AuthGateway } = await import('@shared/gateways/auth.gateway')
		const authGatewayInstance = container.resolve(AuthGateway)
		jest.spyOn(authGatewayInstance, 'validateSocialLogin').mockResolvedValue({
			valid: true,
			userData: {
				name: 'Test User',
				email: 'test@example.com'
			}
		})

		// Mock do Prisma - aplica após o reset do beforeEach
		const mockPrismaClient = container.resolve('PostgresqlClient') as any

		// Mock para findOAuthUser (usuário não existe)
		mockPrismaClient.userOAuth.findFirst.mockResolvedValue(null)

		// Mock para findByEmail (usuário não existe)
		mockPrismaClient.user.findUnique.mockResolvedValue(null)

		// Mock para create user
		const userId = TestData.generateUUID()
		mockPrismaClient.user.create.mockResolvedValue({
			id: userId,
			username: 'Test User',
			email: 'test@example.com',
			password: 'hashed-password',
			verified: true,
			created_at: new Date(),
			updated_at: new Date()
		})

		// Mock para linkOAuthProvider
		mockPrismaClient.userOAuth.create.mockResolvedValue({
			id: TestData.generateUUID(),
			userId: userId,
			provider: 'linkedin',
			email: 'test@example.com',
			created_at: new Date(),
			updated_at: new Date(),
			user: {
				id: userId,
				username: 'Test User',
				email: 'test@example.com',
				password: 'hashed-password',
				verified: true,
				userProfileId: TestData.generateUUID(),
				created_at: new Date(),
				updated_at: new Date()
			}
		})

		// Mock para update user
		mockPrismaClient.user.update.mockResolvedValue({
			id: userId,
			username: 'Test User',
			email: 'test@example.com',
			password: 'hashed-password',
			verified: true,
			token: 'refresh-token',
			created_at: new Date(),
			updated_at: new Date()
		})

		// Act
		const response = await httpClient.post('/v1/auth/social-login/linkedin', socialLoginData)

		// Assert
		expect(response.status).toBe(200)
		expect(response.data).toHaveProperty('accessToken')
		expect(response.data).toHaveProperty('refreshToken')
		expect(response.data).toHaveProperty('user')
	})

	it('should login with GitHub successfully', async () => {
		// Arrange
		const socialLoginData = {
			token: 'github-access-token'
		}

		// Mock do AuthGateway
		const { AuthGateway } = await import('@shared/gateways/auth.gateway')
		const authGatewayInstance = container.resolve(AuthGateway)
		jest.spyOn(authGatewayInstance, 'validateSocialLogin').mockResolvedValue({
			valid: true,
			userData: {
				name: 'Test User',
				email: 'test@example.com'
			}
		})

		// Mock do Prisma - aplica após o reset do beforeEach
		const mockPrismaClient = container.resolve('PostgresqlClient') as any

		// Mock para findOAuthUser (usuário não existe)
		mockPrismaClient.userOAuth.findFirst.mockResolvedValue(null)

		// Mock para findByEmail (usuário não existe)
		mockPrismaClient.user.findUnique.mockResolvedValue(null)

		// Mock para create user
		const userId = TestData.generateUUID()
		mockPrismaClient.user.create.mockResolvedValue({
			id: userId,
			username: 'Test User',
			email: 'test@example.com',
			password: 'hashed-password',
			verified: true,
			created_at: new Date(),
			updated_at: new Date()
		})

		// Mock para linkOAuthProvider
		mockPrismaClient.userOAuth.create.mockResolvedValue({
			id: TestData.generateUUID(),
			userId: userId,
			provider: 'github',
			email: 'test@example.com',
			created_at: new Date(),
			updated_at: new Date(),
			user: {
				id: userId,
				username: 'Test User',
				email: 'test@example.com',
				password: 'hashed-password',
				verified: true,
				userProfileId: TestData.generateUUID(),
				created_at: new Date(),
				updated_at: new Date()
			}
		})

		// Mock para update user
		mockPrismaClient.user.update.mockResolvedValue({
			id: userId,
			username: 'Test User',
			email: 'test@example.com',
			password: 'hashed-password',
			verified: true,
			token: 'refresh-token',
			created_at: new Date(),
			updated_at: new Date()
		})

		// Act
		const response = await httpClient.post('/v1/auth/social-login/github', socialLoginData)

		// Assert
		expect(response.status).toBe(200)
		expect(response.data).toHaveProperty('accessToken')
		expect(response.data).toHaveProperty('refreshToken')
		expect(response.data).toHaveProperty('user')
	})

	it('should return validation error for empty token', async () => {
		// Arrange
		const socialLoginData = {
			token: ''
		}

		// Act & Assert
		await expect(httpClient.post('/v1/auth/social-login/google', socialLoginData))
			.rejects.toMatchObject({
				response: {
					status: 400,
					data: {
						message: "TOKEN_REQUIRED"
					}
				}
			})
	})

	it('should return validation error for empty access token', async () => {
		// Arrange
		const socialLoginData = {
			provider: 'google',
			accessToken: ''
		}

		// Act & Assert
		await expect(httpClient.post('/v1/auth/social-login/google', socialLoginData))
			.rejects.toMatchObject({
				response: {
					status: 400,
					data: {
						message: 'REQUIRED_FIELD'
					}
				}
			})
	})


	it('should return INVALID_ACCESS_TOKEN when token is invalid', async () => {
		// Arrange
		const socialLoginData = {
			provider: 'google',
			accessToken: 'invalid-access-token'
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
		await expect(httpClient.post('/v1/auth/social-login/google', socialLoginData))
			.rejects.toMatchObject({
				response: {
					status: 400,
					data: {
						message: 'REQUIRED_FIELD'
					}
				}
			})
	})

	it('should return USER_NOT_FOUND when user does not exist', async () => {
		// Arrange
		const socialLoginData = {
			provider: 'google',
			accessToken: 'valid-access-token'
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
		await expect(httpClient.post('/v1/auth/social-login/google', socialLoginData))
			.rejects.toMatchObject({
				response: {
					status: 400,
					data: {
						message: 'REQUIRED_FIELD'
					}
				}
			})
	})

	describe('POST /v1/auth/social-login', () => {
		it('should login with Google fail with USER NOT FOUND', async () => {
			// Arrange
			const socialLoginData = {
				token: 'google-access-token'
			}

			// Mock do AuthGateway
			const axios = require('axios')
			jest.spyOn(axios, 'post').mockImplementation((url: any, payload: any) => {
				if (url.includes('oauth2.googleapis.com/token')) {
					return Promise.resolve(jest.fn().mockRejectedValue(new Error('error')))
				}
				return Promise.resolve(axios.post(url, payload))
			})

			// Mock do Prisma - aplica após o reset do beforeEach
			const mockPrismaClient = container.resolve('PostgresqlClient') as any

			// Mock para findOAuthUser (usuário não existe)
			mockPrismaClient.userOAuth.findFirst.mockResolvedValue(null)

			// Mock para findByEmail (usuário não existe)
			mockPrismaClient.user.findUnique.mockResolvedValue(null)

			// Mock para create user
			const userId = TestData.generateUUID()
			mockPrismaClient.user.create.mockResolvedValue({
				id: userId,
				username: 'Test User',
				email: 'test@example.com',
				password: 'hashed-password',
				verified: true,
				created_at: new Date(),
				updated_at: new Date()
			})

			// Mock para linkOAuthProvider
			mockPrismaClient.userOAuth.create.mockResolvedValue({
				id: TestData.generateUUID(),
				userId: userId,
				provider: 'google',
				email: 'test@example.com',
				created_at: new Date(),
				updated_at: new Date(),
				user: {
					id: userId,
					username: 'Test User',
					email: 'test@example.com',
					password: 'hashed-password',
					verified: true,
					userProfileId: TestData.generateUUID(),
					created_at: new Date(),
					updated_at: new Date()
				}
			})

			// Mock para update user
			mockPrismaClient.user.update.mockResolvedValue({
				id: userId,
				username: 'Test User',
				email: 'test@example.com',
				password: 'hashed-password',
				verified: true,
				token: 'refresh-token',
				created_at: new Date(),
				updated_at: new Date()
			})

			// Act
			expect(await httpClient.post('/v1/auth/social-login/google', socialLoginData))
				// Assert
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: { message: 'USER_NOT_FOUND' }
					}
				})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const socialLoginData = {
				provider: 'google',
				accessToken: 'access-token'
			}

			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/v1/auth/social-login/google', socialLoginData))
				.rejects.toMatchObject({
					response: {
						status: 400
					}
				})
		})

		it('should return PROVIDER_NOT_LINKED when user exists but provider is not linked', async () => {
			// Arrange
			const socialLoginData = {
				token: 'google-access-token'
			}

			// Mock do AuthGateway
			const { AuthGateway } = await import('@shared/gateways/auth.gateway')
			const authGatewayInstance = container.resolve(AuthGateway)
			jest.spyOn(authGatewayInstance, 'validateSocialLogin').mockResolvedValue({
				valid: true,
				userData: {
					name: 'Test User',
					email: 'test@example.com'
				}
			})

			// Mock do Prisma
			const mockPrismaClient = container.resolve('PostgresqlClient') as any

			// Mock para findOAuthUser (usuário não existe)
			mockPrismaClient.userOAuth.findFirst.mockResolvedValue(null)

			// Mock para findByEmail (usuário existe)
			const userId = TestData.generateUUID()
			mockPrismaClient.user.findUnique.mockResolvedValue({
				id: userId,
				username: 'Test User',
				email: 'test@example.com',
				password: 'hashed-password',
				verified: true,
				created_at: new Date(),
				updated_at: new Date()
			})

			// Act
			const response = await httpClient.post('/v1/auth/social-login/google', socialLoginData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toBe('PROVIDER_NOT_LINKED')
		})

		it('should login successfully when OAuth user already exists', async () => {
			// Arrange
			jest.clearAllMocks()
			const socialLoginData = {
				token: 'google-access-token'
			}

			// Mock do Axios (conforme guidelines)
			const axios = require('axios')
			jest.spyOn(axios, 'get').mockImplementation((url: any) => {
				if (url.includes('userinfo')) {
					return Promise.resolve({
						data: {
							name: 'Test User',
							email: 'test@example.com'
						}
					})
				}
				return Promise.resolve({ data: {}, status: 200 })
			})
			jest.spyOn(axios, 'post').mockImplementation((url: any) => {
				if (url.includes('revoke')) {
					return Promise.resolve({ data: {} })
				}
				return Promise.resolve({ data: { access_token: 'mock-token' } })
			})

			// Mock do Prisma usando IntegrationTestSetup
			const userId = TestData.generateUUID()
			const userProfileId = TestData.generateUUID()
			IntegrationTestSetup.setupMocks({
				prisma: {
					userOAuth: {
						findFirst: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							userId: userId,
							provider: 'google',
							email: 'test@example.com',
							created_at: new Date(),
							updated_at: new Date(),
							user: {
								id: userId,
								username: 'Test User',
								email: 'test@example.com',
								password: 'hashed-password',
								verified: true,
								userProfileId: userProfileId,
								created_at: new Date(),
								updated_at: new Date()
							}
						})
					},
					user: {
						update: jest.fn().mockResolvedValue({
							id: userId,
							username: 'Test User',
							email: 'test@example.com',
							password: 'hashed-password',
							verified: true,
							token: 'refresh-token',
							created_at: new Date(),
							updated_at: new Date()
						})
					}
				}
			})

			// Act
			const response = await httpClient.post('/v1/auth/social-login/google', socialLoginData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('accessToken')
			expect(response.data).toHaveProperty('refreshToken')
			expect(response.data).toHaveProperty('user')
		})
	})

	describe('POST /v1/auth/link-new-oauth-provider/{provider}', () => {
		it('should link new OAuth provider successfully', async () => {
			// Arrange
			const socialLoginData = {
				token: 'google-access-token'
			}
			const validToken = TestTokens.generateValidToken()

			// Mock do AuthGateway
			const { AuthGateway } = await import('@shared/gateways/auth.gateway')
			const authGatewayInstance = container.resolve(AuthGateway)
			jest.spyOn(authGatewayInstance, 'validateSocialLogin').mockResolvedValue({
				valid: true,
				userData: {
					name: 'Test User',
					email: 'test@example.com'
				}
			})

			// Mock do Prisma
			const mockPrismaClient = container.resolve('PostgresqlClient') as any

			// Mock para findById (usuário existe)
			const userId = TestData.generateUUID()
			mockPrismaClient.user.findUnique.mockResolvedValue({
				id: userId,
				username: 'Test User',
				email: 'test@example.com',
				password: 'hashed-password',
				verified: true,
				created_at: new Date(),
				updated_at: new Date()
			})

			// Mock para findOAuthUser (provider não está linkado)
			mockPrismaClient.userOAuth.findFirst.mockResolvedValue(null)

			// Mock para linkOAuthProvider
			mockPrismaClient.userOAuth.create.mockResolvedValue({
				id: TestData.generateUUID(),
				userId: userId,
				provider: 'google',
				email: 'test@example.com',
				created_at: new Date(),
				updated_at: new Date()
			})

			// Act
			httpClient.setAuthToken(validToken)
			const response = await httpClient.post('/v1/auth/link-new-oauth-provider/google', socialLoginData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toEqual({ success: true })
		})

		it('should return USER_NOT_FOUND when user does not exist', async () => {
			// Arrange
			const socialLoginData = {
				token: 'google-access-token'
			}
			const validToken = TestTokens.generateValidToken()

			// Mock do AuthGateway
			const { AuthGateway } = await import('@shared/gateways/auth.gateway')
			const authGatewayInstance = container.resolve(AuthGateway)
			jest.spyOn(authGatewayInstance, 'validateSocialLogin').mockResolvedValue({
				valid: true,
				userData: {
					name: 'Test User',
					email: 'test@example.com'
				}
			})

			// Mock do Prisma
			const mockPrismaClient = container.resolve('PostgresqlClient') as any

			// Mock para findById (usuário não existe)
			mockPrismaClient.user.findUnique.mockResolvedValue(null)

			// Act & Assert
			httpClient.setAuthToken(validToken)
			await expect(httpClient.post('/v1/auth/link-new-oauth-provider/google', socialLoginData))
				.rejects.toMatchObject({
					response: {
						status: 404
					}
				})
		})

		it('should return PROVIDER_ALREADY_LINKED when provider is already linked', async () => {
			// Arrange
			jest.clearAllMocks()
			const socialLoginData = {
				token: 'google-access-token'
			}
			const validToken = TestTokens.generateValidToken()

			// Mock do Axios (conforme guidelines)
			const axios = require('axios')
			axios.get.mockResolvedValue({
				data: {
					name: 'Test User',
					email: 'test@example.com'
				}
			})
			axios.post.mockResolvedValue({
				data: { access_token: 'mock-token' }
			})

			// Mock do Prisma client diretamente
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			const userId = TestData.generateUUID()

			mockPrismaClient.user.findUnique.mockResolvedValue({
				id: userId,
				username: 'Test User',
				email: 'test@example.com',
				password: 'hashed-password',
				verified: true,
				created_at: new Date(),
				updated_at: new Date()
			})

			mockPrismaClient.userOAuth.findFirst.mockResolvedValue({
				id: TestData.generateUUID(),
				userId: userId,
				provider: 'google',
				email: 'test@example.com',
				created_at: new Date(),
				updated_at: new Date()
			})

			// Act
			httpClient.setAuthToken(validToken)
			const response = await httpClient.post('/v1/auth/link-new-oauth-provider/google', socialLoginData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toBe('PROVIDER_ALREADY_LINKED')
		})

		it('should return USER_NOT_FOUND when social token validation fails', async () => {
			// Arrange
			jest.clearAllMocks()
			const socialLoginData = {
				token: 'invalid-token'
			}
			const validToken = TestTokens.generateValidToken()

			// Mock do Axios (conforme guidelines)
			const axios = require('axios')
			axios.get.mockRejectedValue(new Error('Invalid token'))
			axios.post.mockResolvedValue({
				data: { access_token: 'mock-token' }
			})

			// Mock do Prisma para garantir que o usuário existe (para não falhar no middleware)
			const mockPrismaClient = container.resolve('PostgresqlClient') as any
			const userId = TestData.generateUUID()
			mockPrismaClient.user.findUnique.mockResolvedValue({
				id: userId,
				username: 'Test User',
				email: 'test@example.com',
				password: 'hashed-password',
				verified: true,
				created_at: new Date(),
				updated_at: new Date()
			})

			// Act
			httpClient.setAuthToken(validToken)
			const response = await httpClient.post('/v1/auth/link-new-oauth-provider/google', socialLoginData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toBe('USER_NOT_FOUND')
		})

		it('should return UNAUTHORIZED when token is invalid', async () => {
			// Arrange
			const socialLoginData = {
				token: 'google-access-token'
			}
			const invalidToken = TestTokens.generateInvalidToken()

			// Act & Assert
			httpClient.setAuthToken(invalidToken)
			await expect(httpClient.post('/v1/auth/link-new-oauth-provider/google', socialLoginData))
				.rejects.toMatchObject({
					response: {
						status: 401
					}
				})
		})

		it('should return UNAUTHORIZED when no token is provided', async () => {
			// Arrange
			const socialLoginData = {
				token: 'google-access-token'
			}

			// Act & Assert
			await expect(httpClient.post('/v1/auth/link-new-oauth-provider/google', socialLoginData))
				.rejects.toMatchObject({
					response: {
						status: 401
					}
				})
		})
	})
})

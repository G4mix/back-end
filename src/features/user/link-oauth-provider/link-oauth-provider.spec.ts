import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'
import { TestTokens } from '@test/helpers/test-tokens'
import { container } from 'tsyringe'

describe('Link OAuth Provider Integration Tests', () => {
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
		// Limpa todos os mocks antes de cada teste
		jest.clearAllMocks()
		IntegrationTestSetup.clearMocks()
		// Mock global do axios para todos os testes
		const axios = require('axios')
		jest.spyOn(axios, 'get').mockImplementation((url: any, config: any) => {
			// Google
			if (url === 'https://www.googleapis.com/userinfo/v2/me') {
				// Verifica se o token é inválido
				if (config?.headers?.Authorization?.includes('invalid-token')) {
					return Promise.reject({
						response: {
							status: 401,
							data: { error: { message: 'Invalid token' } }
						}
					})
				}
				return Promise.resolve({
					data: {
						name: 'Test User',
						email: 'test@example.com'
					}
				})
			}
			// GitHub
			if (url === 'https://api.github.com/user') {
				return Promise.resolve({
					data: {
						name: 'Test User',
						email: 'test@example.com'
					}
				})
			}
			if (url === 'https://api.github.com/user/emails') {
				return Promise.resolve({
					data: [
						{ email: 'test@example.com', primary: true, verified: true }
					]
				})
			}
			// LinkedIn
			if (url === 'https://api.linkedin.com/v2/userinfo') {
				return Promise.resolve({
					data: {
						firstName: { localized: { en_US: 'Test' } },
						lastName: { localized: { en_US: 'User' } },
						id: 'linkedin-user-id'
					}
				})
			}
			if (url === 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))') {
				return Promise.resolve({
					data: {
						elements: [
							{
								'handle~': {
									emailAddress: 'test@example.com'
								}
							}
						]
					}
				})
			}
			return Promise.resolve(axios.get(url, config))
		})
		
		jest.spyOn(axios, 'post').mockImplementation((url: any, payload: any) => {
			// Google OAuth
			if (url === 'https://oauth2.googleapis.com/token') {
				return Promise.resolve({ data: { access_token: 'mock-google-token' } })
			}
			// Google Revoke
			if (url.includes('oauth2.googleapis.com/revoke')) {
				return Promise.resolve({ data: {} })
			}
			// GitHub OAuth
			if (url === 'https://github.com/login/oauth/access_token') {
				return Promise.resolve({ data: { access_token: 'mock-github-token' } })
			}
			// LinkedIn OAuth
			if (url === 'https://www.linkedin.com/oauth/v2/accessToken') {
				return Promise.resolve({ data: { access_token: 'mock-linkedin-token' } })
			}
			// LinkedIn Revoke
			if (url === 'https://www.linkedin.com/oauth/v2/revoke') {
				return Promise.resolve({ data: {} })
			}
			return Promise.resolve(axios.post(url, payload))
		})
		
		jest.spyOn(axios, 'delete').mockImplementation((url: any, config: any) => {
			// GitHub revoke
			if (url.includes('api.github.com/applications')) {
				return Promise.resolve({ data: {} })
			}
			return Promise.resolve(axios.delete(url, config))
		})
	})

	describe('POST /v1/user/link-new-oauth-provider/{provider}', () => {
		it('should link new OAuth provider successfully', async () => {
			// Arrange
			const socialLoginData = {
				token: 'google-access-token'
			}
			const validToken = TestTokens.generateValidToken()

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
			const response = await httpClient.post('/v1/user/link-new-oauth-provider/google', socialLoginData)

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


			// Mock do Prisma
			const mockPrismaClient = container.resolve('PostgresqlClient') as any

			// Mock para findById (usuário não existe)
			mockPrismaClient.user.findUnique.mockResolvedValue(null)

			// Act & Assert
			httpClient.setAuthToken(validToken)
			await expect(httpClient.post('/v1/user/link-new-oauth-provider/google', socialLoginData))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: {
							message: 'USER_NOT_FOUND',
							code: 404
						}
					}
				})
		})

		it('should return PROVIDER_ALREADY_LINKED when provider is already linked', async () => {
			// Arrange
			const socialLoginData = {
				token: 'google-access-token'
			}
			const validToken = TestTokens.generateValidToken()

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

			// Mock usando IntegrationTestSetup para garantir que seja aplicado corretamente
			IntegrationTestSetup.setupMocks({
				prisma: {
					userOAuth: {
						findUnique: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							userId: userId,
							provider: 'google',
							email: 'test@example.com',
							created_at: new Date(),
							updated_at: new Date()
						})
					}
				}
			})

			// Act
			httpClient.setAuthToken(validToken)
			await expect(httpClient.post('/v1/user/link-new-oauth-provider/google', socialLoginData))
				// Assert
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'PROVIDER_ALREADY_LINKED',
							code: 400
						}
					}
				})
		})

		it('should return USER_NOT_FOUND when social token validation fails', async () => {
			// Arrange
			jest.clearAllMocks()
			const socialLoginData = {
				token: 'invalid-token'
			}
			const validToken = TestTokens.generateValidToken()

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
			await expect(httpClient.post('/v1/user/link-new-oauth-provider/google', socialLoginData))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: {
							message: 'USER_NOT_FOUND',
							code: 404
						}
					}
				})
		})

		it('should return UNAUTHORIZED when token is invalid', async () => {
			// Arrange
			const socialLoginData = {
				token: 'google-access-token'
			}
			const invalidToken = TestTokens.generateInvalidToken()

			// Act & Assert
			httpClient.setAuthToken(invalidToken)
			await expect(httpClient.post('/v1/user/link-new-oauth-provider/google', socialLoginData))
				.rejects.toMatchObject({
					response: {
						status: 401,
						data: {
							message: 'UNAUTHORIZED',
							code: 401
						}
					}
				})
		})

		it('should return UNAUTHORIZED when no token is provided', async () => {
			// Arrange
			const socialLoginData = {
				token: 'google-access-token'
			}

			// Act & Assert
			await expect(httpClient.post('/v1/user/link-new-oauth-provider/google', socialLoginData))
				.rejects.toMatchObject({
					response: {
						status: 401,
						data: {
							message: 'UNAUTHORIZED',
							code: 401
						}
					}
				})
		})
	})

})

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

	describe('PATCH /v1/auth/change-password', () => {
		it('should change password successfully with valid data', async () => {
			// Arrange
			const changePasswordData = {
				currentPassword: 'OldPassword123!',
				newPassword: 'NewPassword123!'
			}
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							password: '$2b$10$hashedpassword',
							verified: true
						}),
						update: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							password: '$2b$10$newhashedpassword'
						})
					}
				}
			})

			// Act
			const response = await httpClient.patch('/v1/auth/change-password', changePasswordData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('message')
		})

		it('should return validation error for empty current password', async () => {
			// Arrange
			const changePasswordData = {
				currentPassword: '',
				newPassword: 'NewPassword123!'
			}

			// Act & Assert
			await expect(httpClient.patch('/v1/auth/change-password', changePasswordData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'CURRENT_PASSWORD_REQUIRED'
						}
					}
				})
		})

		it('should return validation error for empty new password', async () => {
			// Arrange
			const changePasswordData = {
				currentPassword: 'OldPassword123!',
				newPassword: ''
			}

			// Act & Assert
			await expect(httpClient.patch('/v1/auth/change-password', changePasswordData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'NEW_PASSWORD_REQUIRED'
						}
					}
				})
		})

		it('should return validation error for weak new password', async () => {
			// Arrange
			const changePasswordData = {
				currentPassword: 'OldPassword123!',
				newPassword: '123'
			}

			// Act & Assert
			await expect(httpClient.patch('/v1/auth/change-password', changePasswordData))
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
				currentPassword: 'OldPassword123!',
				newPassword: 'newpassword123!'
			}

			// Act & Assert
			await expect(httpClient.patch('/v1/auth/change-password', changePasswordData))
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
				currentPassword: 'OldPassword123!',
				newPassword: 'NewPassword123'
			}

			// Act & Assert
			await expect(httpClient.patch('/v1/auth/change-password', changePasswordData))
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
				currentPassword: 'OldPassword123!',
				newPassword: 'NewPassword123!'
			}
			httpClient.clearAuthToken()

			// Act & Assert
			await expect(httpClient.patch('/v1/auth/change-password', changePasswordData))
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
			const changePasswordData = {
				currentPassword: 'OldPassword123!',
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
			await expect(httpClient.patch('/v1/auth/change-password', changePasswordData))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: {
							message: 'USER_NOT_FOUND'
						}
					}
				})
		})

		it('should return INVALID_CURRENT_PASSWORD when current password is wrong', async () => {
			// Arrange
			const changePasswordData = {
				currentPassword: 'WrongPassword123!',
				newPassword: 'NewPassword123!'
			}

			// Mock do Prisma para retornar usuário existente
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							password: '$2b$10$hashedpassword',
							verified: true
						})
					}
				}
			})

			// Act & Assert
			await expect(httpClient.patch('/v1/auth/change-password', changePasswordData))
				.rejects.toMatchObject({
					response: {
						status: 401,
						data: {
							message: 'INVALID_CURRENT_PASSWORD'
						}
					}
				})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const changePasswordData = {
				currentPassword: 'OldPassword123!',
				newPassword: 'NewPassword123!'
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
			await expect(httpClient.patch('/v1/auth/change-password', changePasswordData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

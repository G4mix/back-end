import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestTokens } from '@test/helpers/test-tokens'

describe('Update User Integration Tests', () => {
	let httpClient: HttpClient
	let baseUrl: string
	let authToken: string

	beforeAll(async () => {
		// Usa o servidor global
		baseUrl = IntegrationTestSetup.getBaseUrl()
		httpClient = new HttpClient(baseUrl)
		
		// Gera token válido usando o helper
		authToken = TestTokens.generateValidToken()
		httpClient.setAuthToken(authToken)
	})

	beforeEach(() => {
		// Limpa mocks antes de cada teste
		IntegrationTestSetup.clearMocks()
	})

	describe('PATCH /v1/user', () => {
		it('should update user successfully with valid data', async () => {
			// Arrange
			const updateData = {
				displayName: 'Updated Name',
				autobiography: 'Updated bio with enough characters to pass validation'
			}

			// Mock do Prisma
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'test@example.com',
				username: 'testuser',
				verified: true,
				userProfile: {
					id: 'profile-123',
					displayName: 'Original Name',
					autobiography: 'Original bio'
				}
			})
			mockPrismaClient.user.update.mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'test@example.com',
				username: 'testuser',
				verified: true,
				userProfile: {
					id: 'profile-123',
					displayName: updateData.displayName,
					autobiography: updateData.autobiography
				}
			})

			// Act
			const response = await httpClient.patch('/v1/user', updateData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('user')
			expect(response.data.user.userProfile.displayName).toBe(updateData.displayName)
			expect(response.data.user.userProfile.autobiography).toBe(updateData.autobiography)
		})

		it('should return validation error for long name', async () => {
			// Arrange
			const updateData = {
				displayName: 'A'.repeat(256), // Excede 255 caracteres
				autobiography: 'Valid bio with enough characters'
			}

			// Act & Assert
			await expect(httpClient.patch('/v1/user', updateData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'NAME_TOO_LONG'
						}
					}
				})
		})

		it('should return validation error for long bio', async () => {
			// Arrange
			const updateData = {
				displayName: 'Valid Name',
				autobiography: 'A'.repeat(501) // Excede 500 caracteres
			}

			// Act & Assert
			await expect(httpClient.patch('/v1/user', updateData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'BIO_TOO_LONG'
						}
					}
				})
		})

		it('should return validation error for invalid icon URL', async () => {
			// Arrange
			const updateData = {
				displayName: 'Valid Name',
				autobiography: 'Valid bio with enough characters to pass validation',
				icon: 'invalid-url'
			}

			// Act & Assert
			await expect(httpClient.patch('/v1/user', updateData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_ICON_URL'
						}
					}
				})
		})

		it('should return validation error for invalid background image URL', async () => {
			// Arrange
			const updateData = {
				displayName: 'Valid Name',
				autobiography: 'Valid bio with enough characters to pass validation',
				backgroundImage: 'invalid-url'
			}

			// Act & Assert
			await expect(httpClient.patch('/v1/user', updateData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_BACKGROUND_IMAGE_URL'
						}
					}
				})
		})

		it('should return UNAUTHORIZED when no token provided', async () => {
			// Arrange
			httpClient.clearAuthToken()

			const updateData = {
				displayName: 'Updated Name',
				autobiography: 'Updated bio'
			}

			// Act & Assert
			await expect(httpClient.patch('/v1/user', updateData))
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
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)
			
			const updateData = {
				displayName: 'Updated Name',
				autobiography: 'Updated bio'
			}

			// Mock do Prisma para retornar null
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockResolvedValue(null)

			// Act & Assert
			await expect(httpClient.patch('/v1/user', updateData))
				.rejects.toMatchObject({
					response: {
						status: 404,
						data: {
							message: 'USER_NOT_FOUND'
						}
					}
				})
		})

		it('should update user with partial data', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)
			
			const updateData = {
				displayName: 'Updated Name Only'
			}

			// Mock do Prisma
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'test@example.com',
				username: 'testuser',
				verified: true,
				userProfile: {
					id: 'profile-123',
					displayName: 'Original Name',
					autobiography: 'Original bio'
				}
			})
			mockPrismaClient.user.update.mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'test@example.com',
				username: 'testuser',
				verified: true,
				userProfile: {
					id: 'profile-123',
					displayName: 'Updated Name Only',
					autobiography: 'Original bio'
				}
			})

			// Act
			const response = await httpClient.patch('/v1/user', updateData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('user')
			expect(response.data.user.userProfile.displayName).toBe('Updated Name Only')
			expect(response.data.user.userProfile.autobiography).toBe('Original bio')
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)
			
			const updateData = {
				displayName: 'Updated Name',
				autobiography: 'Updated bio'
			}

			// Mock do Prisma para simular erro no update
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'test@example.com',
				username: 'testuser',
				verified: true,
				userProfile: {
					id: 'profile-123',
					displayName: 'Original Name',
					autobiography: 'Original bio'
				}
			})
			mockPrismaClient.user.update.mockRejectedValue(new Error('Database error'))

			// Act & Assert
			await expect(httpClient.patch('/v1/user', updateData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})
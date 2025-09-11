import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'
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

	describe('PATCH /v1/users', () => {
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
				username: 'testuser',
				email: 'test@example.com',
				verified: true,
				created_at: new Date(),
				updated_at: new Date(),
				userProfile: {
					id: 'profile-123',
					displayName: 'Original Name',
					autobiography: 'Original bio',
					icon: null,
					backgroundImage: null,
					links: [],
					_count: {
						followers: 10,
						following: 5
					}
				}
			})
			
			mockPrismaClient.user.update.mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				username: 'testuser',
				email: 'test@example.com',
				verified: true,
				created_at: new Date(),
				updated_at: new Date(),
				userProfile: {
					id: 'profile-123',
					displayName: updateData.displayName,
					autobiography: updateData.autobiography,
					icon: null,
					backgroundImage: null,
					links: [],
					_count: {
						followers: 10,
						following: 5
					}
				}
			})

			// Act
			const response = await httpClient.patch('/v1/users', updateData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('user')
			expect(response.data.user.userProfile.displayName).toBe(updateData.displayName)
			expect(response.data.user.userProfile.autobiography).toBe(updateData.autobiography)
		})

		it('should return validation error for long name', async () => {
			// Arrange
			const updateData = {
				name: 'A'.repeat(101), // Excede 100 caracteres
				bio: 'Valid bio with enough characters'
			}

			// Act & Assert
			await expect(httpClient.patch('/v1/users', updateData))
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
				name: 'Valid Name',
				bio: 'A'.repeat(501) // Excede 500 caracteres
			}

			// Act & Assert
			await expect(httpClient.patch('/v1/users', updateData))
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
				name: 'Valid Name',
				bio: 'Valid bio',
				icon: 'invalid-url'
			}

			// Act & Assert
			await expect(httpClient.patch('/v1/users', updateData))
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
				name: 'Valid Name',
				bio: 'Valid bio',
				backgroundImage: 'invalid-url'
			}

			// Act & Assert
			await expect(httpClient.patch('/v1/users', updateData))
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
			const updateData = {
				name: 'Updated Name',
				bio: 'Updated bio'
			}
			httpClient.clearAuthToken()

			// Act & Assert
			await expect(httpClient.patch('/v1/users', updateData))
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
			const updateData = {
				name: 'Updated Name',
				bio: 'Updated bio'
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
			await expect(httpClient.patch('/v1/users', updateData))
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
			const updateData = {
				name: 'Updated Name Only'
			}
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							username: 'testuser',
							email: 'test@example.com',
							verified: true
						}),
						update: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							username: 'testuser',
							email: 'test@example.com',
							verified: true,
							userProfile: {
								name: updateData.name,
								bio: 'Old bio',
								icon: 'https://example.com/old-icon.jpg',
								backgroundImage: 'https://example.com/old-background.jpg'
							}
						})
					}
				}
			})

			// Act
			const response = await httpClient.patch('/v1/users', updateData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.user.userProfile.name).toBe(updateData.name)
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const updateData = {
				name: 'Updated Name',
				bio: 'Updated bio'
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
			await expect(httpClient.patch('/v1/users', updateData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

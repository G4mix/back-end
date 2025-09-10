import { IntegrationTestSetup } from '@test/setup/integration-test-setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Update User Integration Tests', () => {
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

	describe('PUT /api/v1/users', () => {
		it('should update user successfully with valid data', async () => {
			// Arrange
			const updateData = {
				name: 'Updated Name',
				bio: 'Updated bio with enough characters to pass validation',
				icon: 'https://example.com/updated-icon.jpg',
				backgroundImage: 'https://example.com/updated-background.jpg'
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
								bio: updateData.bio,
								icon: updateData.icon,
								backgroundImage: updateData.backgroundImage
							}
						})
					}
				}
			})

			// Act
			const response = await httpClient.put('/api/v1/users', updateData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('user')
			expect(response.data.user.userProfile.name).toBe(updateData.name)
			expect(response.data.user.userProfile.bio).toBe(updateData.bio)
		})

		it('should return validation error for long name', async () => {
			// Arrange
			const updateData = {
				name: 'A'.repeat(101), // Excede 100 caracteres
				bio: 'Valid bio with enough characters'
			}

			// Act & Assert
			await expect(httpClient.put('/api/v1/users', updateData))
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
			await expect(httpClient.put('/api/v1/users', updateData))
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
			await expect(httpClient.put('/api/v1/users', updateData))
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
			await expect(httpClient.put('/api/v1/users', updateData))
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
			await expect(httpClient.put('/api/v1/users', updateData))
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
			await expect(httpClient.put('/api/v1/users', updateData))
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
			const response = await httpClient.put('/api/v1/users', updateData)

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
			await expect(httpClient.put('/api/v1/users', updateData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

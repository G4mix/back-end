import { IntegrationTestSetup } from '@test/setup/integration-test-setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Get Users Integration Tests', () => {
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

	describe('GET /api/v1/users', () => {
		it('should get users with pagination successfully', async () => {
			// Arrange
			const mockUsers = [
				{
					id: TestData.generateUUID(),
					username: 'testuser1',
					email: 'testuser1@example.com',
					verified: true,
					created_at: new Date(),
					updated_at: new Date(),
					userProfile: {
						name: 'Test User 1',
						bio: 'Bio of test user 1',
						icon: 'https://example.com/user1.jpg'
					},
					_count: {
						followers: 10,
						following: 5
					}
				},
				{
					id: TestData.generateUUID(),
					username: 'testuser2',
					email: 'testuser2@example.com',
					verified: true,
					created_at: new Date(),
					updated_at: new Date(),
					userProfile: {
						name: 'Test User 2',
						bio: 'Bio of test user 2',
						icon: 'https://example.com/user2.jpg'
					},
					_count: {
						followers: 20,
						following: 10
					}
				}
			]

			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findMany: jest.fn().mockResolvedValue(mockUsers),
						count: jest.fn().mockResolvedValue(2)
					}
				}
			})

			// Act
			const response = await httpClient.get('/api/v1/users', {
				page: 0,
				limit: 10
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('users')
			expect(response.data).toHaveProperty('pagination')
			expect(response.data.users).toHaveLength(2)
			expect(response.data.pagination.total).toBe(2)
		})

		it('should get users with search query successfully', async () => {
			// Arrange
			const mockUsers = [
				{
					id: TestData.generateUUID(),
					username: 'testuser',
					email: 'testuser@example.com',
					verified: true,
					created_at: new Date(),
					updated_at: new Date(),
					userProfile: {
						name: 'Test User',
						bio: 'Bio of test user',
						icon: 'https://example.com/user.jpg'
					},
					_count: {
						followers: 10,
						following: 5
					}
				}
			]

			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findMany: jest.fn().mockResolvedValue(mockUsers),
						count: jest.fn().mockResolvedValue(1)
					}
				}
			})

			// Act
			const response = await httpClient.get('/api/v1/users', {
				page: 0,
				limit: 10,
				search: 'testuser'
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('users')
			expect(response.data.users).toHaveLength(1)
		})

		it('should return validation error for invalid page number', async () => {
			// Act & Assert
			await expect(httpClient.get('/api/v1/users', { page: -1 }))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_PAGE'
						}
					}
				})
		})

		it('should return validation error for invalid limit', async () => {
			// Act & Assert
			await expect(httpClient.get('/api/v1/users', { limit: 200 }))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'LIMIT_TOO_LARGE'
						}
					}
				})
		})

		it('should return validation error for negative limit', async () => {
			// Act & Assert
			await expect(httpClient.get('/api/v1/users', { limit: -1 }))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_LIMIT'
						}
					}
				})
		})

		it('should return empty array when no users found', async () => {
			// Arrange
			// Mock do Prisma para retornar array vazio
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findMany: jest.fn().mockResolvedValue([]),
						count: jest.fn().mockResolvedValue(0)
					}
				}
			})

			// Act
			const response = await httpClient.get('/api/v1/users', {
				page: 0,
				limit: 10
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.users).toHaveLength(0)
			expect(response.data.pagination.total).toBe(0)
		})

		it('should get users sorted by creation date', async () => {
			// Arrange
			const mockUsers = [
				{
					id: TestData.generateUUID(),
					username: 'newuser',
					email: 'newuser@example.com',
					verified: true,
					created_at: new Date('2024-01-02'),
					updated_at: new Date('2024-01-02'),
					userProfile: {
						name: 'New User',
						bio: 'Bio of new user',
						icon: 'https://example.com/newuser.jpg'
					},
					_count: {
						followers: 5,
						following: 2
					}
				},
				{
					id: TestData.generateUUID(),
					username: 'olduser',
					email: 'olduser@example.com',
					verified: true,
					created_at: new Date('2024-01-01'),
					updated_at: new Date('2024-01-01'),
					userProfile: {
						name: 'Old User',
						bio: 'Bio of old user',
						icon: 'https://example.com/olduser.jpg'
					},
					_count: {
						followers: 15,
						following: 8
					}
				}
			]

			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findMany: jest.fn().mockResolvedValue(mockUsers),
						count: jest.fn().mockResolvedValue(2)
					}
				}
			})

			// Act
			const response = await httpClient.get('/api/v1/users', {
				page: 0,
				limit: 10
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data.users).toHaveLength(2)
			expect(response.data.users[0].username).toBe('newuser')
			expect(response.data.users[1].username).toBe('olduser')
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findMany: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.get('/api/v1/users', { page: 0, limit: 10 }))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})
	})
})

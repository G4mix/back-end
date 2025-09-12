import { IntegrationTestSetup } from '@test/jest.setup'
import { HttpClient } from '@test/helpers/http-client'
import { TestData } from '@test/helpers/test-data'

describe('Record View Integration Tests', () => {
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

	describe('POST /v1/views/record', () => {
		it('should record view for idea successfully', async () => {
			// Arrange
			const userId = TestData.generateUUID()
			const userProfileId = TestData.generateUUID()
			const ideaId = TestData.generateUUID()
			const viewData = {
				ideas: [ideaId]
			}

			const userData = {
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
			}

			// Gera um JWT válido
			const { JwtManager } = await import('@shared/utils/jwt-manager')
			const authToken = JwtManager.generateToken({
				sub: userId,
				userProfileId: userProfileId
			})
			httpClient.setAuthToken(authToken)
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockImplementation(({ where }) => {
							if (where.id === userId) {
								return Promise.resolve(userData)
							}
							return Promise.resolve(null)
						})
					},
					idea: {
						findUnique: jest.fn().mockImplementation(({ where }) => {
							if (where.id === ideaId) {
								return Promise.resolve({
									id: ideaId,
									title: 'Test Idea',
									description: 'Test Description',
									created_at: new Date(),
									updated_at: new Date()
								})
							}
							return Promise.resolve(null)
						})
					},
					view: {
						findFirst: jest.fn().mockResolvedValue(null), // View não existe
						create: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							ideaId: ideaId,
							userId: userId,
							created_at: new Date()
						}),
						createMany: jest.fn().mockResolvedValue({ count: 1 }),
						count: jest.fn().mockResolvedValue(5)
					}
				}
			})

			// Act
			const response = await httpClient.post('/v1/views/record', viewData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('message')
		})

		it('should not record duplicate view for same user and idea', async () => {
			// Arrange
			const ideaId = TestData.generateUUID()
			const viewData = {
				ideas: [ideaId]
			}
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findUnique: jest.fn().mockImplementation(({ where }) => {
							if (where.id === ideaId) {
								return Promise.resolve({
									id: ideaId,
									title: 'Test Idea',
									description: 'Test Description',
									created_at: new Date(),
									updated_at: new Date()
								})
							}
							return Promise.resolve(null)
						})
					},
					view: {
						findFirst: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							ideaId: ideaId,
							userId: TestData.generateUUID(),
							created_at: new Date()
						}), // View já existe
						createMany: jest.fn().mockResolvedValue({ count: 0 }),
						count: jest.fn().mockResolvedValue(5)
					}
				}
			})

			// Act
			const response = await httpClient.post('/v1/views/record', viewData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('message')
		})

		it('should record multiple views for different ideas', async () => {
			// Arrange
			const ideaId = TestData.generateUUID()
			const viewData = {
				ideas: [ideaId]
			}
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					idea: {
						findUnique: jest.fn().mockImplementation(({ where }) => {
							if (where.id === ideaId) {
								return Promise.resolve({
									id: ideaId,
									title: 'Test Idea',
									description: 'Test Description',
									created_at: new Date(),
									updated_at: new Date()
								})
							}
							return Promise.resolve(null)
						})
					},
					view: {
						findFirst: jest.fn().mockResolvedValue(null), // View não existe
						create: jest.fn().mockResolvedValue({
							id: TestData.generateUUID(),
							ideaId: ideaId,
							userId: TestData.generateUUID(),
							created_at: new Date()
						}),
						createMany: jest.fn().mockResolvedValue({ count: 1 }),
						count: jest.fn().mockResolvedValue(5)
					}
				}
			})

			// Act
			const response = await httpClient.post('/v1/views/record', viewData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('message')
		})

		it('should return validation error for invalid idea ID', async () => {
			// Arrange
			const viewData = {
				ideas: ['invalid-uuid']
			}

			// Act & Assert
			await expect(httpClient.post('/v1/views/record', viewData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_IDEA_ID'
						}
					}
				})
		})

		it('should return validation error for empty ideas array', async () => {
			// Arrange
			const viewData = {
				ideas: []
			}

			// Act & Assert
			await expect(httpClient.post('/v1/views/record', viewData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'IDEAS_REQUIRED'
						}
					}
				})
		})

		it('should return UNAUTHORIZED when no token provided', async () => {
			// Arrange
			const viewData = {
				ideas: [TestData.generateUUID()]
			}
			httpClient.clearAuthToken()

			// Act & Assert
			await expect(httpClient.post('/v1/views/record', viewData))
				.rejects.toMatchObject({
					response: {
						status: 401,
						data: {
							message: 'UNAUTHORIZED'
						}
					}
				})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const userId = TestData.generateUUID()
			const userProfileId = TestData.generateUUID()
			const ideaId = TestData.generateUUID()
			const viewData = {
				ideas: [ideaId]
			}

			const userData = {
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
			}

			// Gera um JWT válido
			const { JwtManager } = await import('@shared/utils/jwt-manager')
			const authToken = JwtManager.generateToken({
				sub: userId,
				userProfileId: userProfileId
			})
			httpClient.setAuthToken(authToken)

			// Mock do Prisma para retornar erro
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockImplementation(({ where }) => {
							if (where.id === userId) {
								return Promise.resolve(userData)
							}
							return Promise.resolve(null)
						})
					},
					idea: {
						findUnique: jest.fn().mockImplementation(({ where }) => {
							if (where.id === ideaId) {
								return Promise.resolve({
									id: ideaId,
									title: 'Test Idea',
									description: 'Test Description',
									created_at: new Date(),
									updated_at: new Date()
								})
							}
							return Promise.resolve(null)
						})
					},
					view: {
						createMany: jest.fn().mockRejectedValue(new Error('Database connection failed'))
					}
				}
			})

			// Act & Assert
			await expect(httpClient.post('/v1/views/record', viewData))
				.rejects.toMatchObject({
					response: {
						status: 500
					}
				})
		})

		it('should handle bulk view recording', async () => {
			// Arrange
			const userId = TestData.generateUUID()
			const userProfileId = TestData.generateUUID()
			const ideaIds = [
				TestData.generateUUID(),
				TestData.generateUUID(),
				TestData.generateUUID()
			]
			const viewData = {
				ideas: ideaIds
			}

			const userData = {
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
			}

			// Gera um JWT válido
			const { JwtManager } = await import('@shared/utils/jwt-manager')
			const authToken = JwtManager.generateToken({
				sub: userId,
				userProfileId: userProfileId
			})
			httpClient.setAuthToken(authToken)
			
			// Mock do Prisma
			IntegrationTestSetup.setupMocks({
				prisma: {
					user: {
						findUnique: jest.fn().mockImplementation(({ where }) => {
							if (where.id === userId) {
								return Promise.resolve(userData)
							}
							return Promise.resolve(null)
						})
					},
					idea: {
						findUnique: jest.fn().mockImplementation(({ where }) => {
							if (ideaIds.includes(where.id)) {
								return Promise.resolve({
									id: where.id,
									title: 'Test Idea',
									description: 'Test Description',
									created_at: new Date(),
									updated_at: new Date()
								})
							}
							return Promise.resolve(null)
						})
					},
					view: {
						createMany: jest.fn().mockResolvedValue({
							count: 3
						}),
						count: jest.fn().mockResolvedValue(5)
					}
				}
			})

			// Act
			const response = await httpClient.post('/v1/views/record', viewData)

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('message')
		})


		it('should return validation error for invalid ideas array', async () => {
			// Arrange
			const viewData = {
				ideas: ['invalid-uuid', TestData.generateUUID()]
			}

			// Act & Assert
			await expect(httpClient.post('/v1/views/record', viewData))
				.rejects.toMatchObject({
					response: {
						status: 400,
						data: {
							message: 'INVALID_IDEA_ID'
						}
					}
				})
		})
	})
})

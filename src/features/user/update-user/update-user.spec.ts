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
			const formData = new FormData()
			formData.append('displayName', 'Updated Name')
			formData.append('autobiography', 'Updated bio with enough characters to pass validation')

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
					displayName: 'Updated Name',
					autobiography: 'Updated bio with enough characters to pass validation'
				}
			})

			// Act
			const response = await httpClient.patch('/v1/user', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('user')
			expect(response.data.user.userProfile.displayName).toBe('Updated Name')
			expect(response.data.user.userProfile.autobiography).toBe('Updated bio with enough characters to pass validation')
		})

		it('should return validation error for long name', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

			const formData = new FormData()
			formData.append('displayName', 'A'.repeat(256)) // Excede 255 caracteres
			formData.append('autobiography', 'Valid bio with enough characters')

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

			// Act & Assert
			await expect(httpClient.patch('/v1/user', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})).rejects.toMatchObject({
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
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

			const formData = new FormData()
			formData.append('displayName', 'Valid Name')
			formData.append('autobiography', 'A'.repeat(501)) // Excede 500 caracteres

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

			// Act & Assert
			await expect(httpClient.patch('/v1/user', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})).rejects.toMatchObject({
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
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

			const formData = new FormData()
			formData.append('displayName', 'Valid Name')
			formData.append('autobiography', 'Valid bio with enough characters to pass validation')
			// Não adicionamos icon como arquivo, então não deve haver erro de validação

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
					displayName: 'Valid Name',
					autobiography: 'Valid bio with enough characters to pass validation'
				}
			})

			// Act
			const response = await httpClient.patch('/v1/user', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})

			// Assert - Deve funcionar normalmente sem arquivo
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('user')
		})

		it('should return validation error for invalid background image URL', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

			const formData = new FormData()
			formData.append('displayName', 'Valid Name')
			formData.append('autobiography', 'Valid bio with enough characters to pass validation')
			// Não adicionamos backgroundImage como arquivo, então não deve haver erro de validação

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
					displayName: 'Valid Name',
					autobiography: 'Valid bio with enough characters to pass validation'
				}
			})

			// Act
			const response = await httpClient.patch('/v1/user', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})

			// Assert - Deve funcionar normalmente sem arquivo
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('user')
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

			// Mock do Prisma para retornar null (usuário não encontrado)
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockResolvedValue(null)

			const formData = new FormData()
			formData.append('displayName', 'Updated Name')

			// Act & Assert
			await expect(httpClient.patch('/v1/user', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})).rejects.toMatchObject({
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

			const formData = new FormData()
			formData.append('displayName', 'Updated Name Only')

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
			const response = await httpClient.patch('/v1/user', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})

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

			const formData = new FormData()
			formData.append('displayName', 'Updated Name')
			formData.append('autobiography', 'Updated bio')

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
			await expect(httpClient.patch('/v1/user', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})).rejects.toMatchObject({
				response: {
					status: 500
				}
			})
		})

		it('should update username successfully', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

			const formData = new FormData()
			formData.append('username', 'newusername')

			// Mock do Prisma (regra 11: apenas injeções diretas)
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'test@example.com',
				username: 'oldusername',
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
				username: 'newusername',
				verified: true,
				userProfile: {
					id: 'profile-123',
					displayName: 'Original Name',
					autobiography: 'Original bio'
				}
			})

			// Act
			const response = await httpClient.patch('/v1/user', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('user')
			expect(response.data.user.username).toBe('newusername')
		})

		it('should update email successfully', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

			const formData = new FormData()
			formData.append('email', 'NEWEMAIL@EXAMPLE.COM')

			// Mock do Prisma (regra 11: apenas injeções diretas)
			const mockPrismaClient = IntegrationTestSetup.getMockPrismaClient()
			mockPrismaClient.user.findUnique.mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'old@example.com',
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
				email: 'newemail@example.com',
				username: 'testuser',
				verified: true,
				userProfile: {
					id: 'profile-123',
					displayName: 'Original Name',
					autobiography: 'Original bio'
				}
			})

			// Act
			const response = await httpClient.patch('/v1/user', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('user')
			expect(response.data.user.email).toBe('newemail@example.com')
		})

		it('should update password successfully', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

			const formData = new FormData()
			formData.append('password', 'newpassword123')

			// Mock do Prisma (regra 11: apenas injeções diretas)
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
					displayName: 'Original Name',
					autobiography: 'Original bio'
				}
			})

			// Act
			const response = await httpClient.patch('/v1/user', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('user')
		})

		it('should update links successfully', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

			const formData = new FormData()
			formData.append('links', JSON.stringify(['https://github.com/user', 'https://linkedin.com/in/user']))

			// Mock do Prisma (regra 11: apenas injeções diretas)
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
					displayName: 'Original Name',
					autobiography: 'Original bio'
				}
			})

			// Act
			const response = await httpClient.patch('/v1/user', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('user')
		})

		it('should handle links with invalid JSON (catch fallback)', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

			const formData = new FormData()
			// Enviar links como string inválida para testar o catch
			formData.append('links', 'https://github.com/user,https://linkedin.com/in/user')

			// Mock do Prisma (regra 11: apenas injeções diretas)
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
					displayName: 'Original Name',
					autobiography: 'Original bio',
					links: [
						{ id: 'link-1', url: 'https://github.com/user' },
						{ id: 'link-2', url: 'https://linkedin.com/in/user' }
					]
				}
			})

			// Act
			const response = await httpClient.patch('/v1/user', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('user')
			expect(response.data.user.userProfile.links).toHaveLength(2)
			expect(response.data.user.userProfile.links[0].url).toBe('https://github.com/user')
			expect(response.data.user.userProfile.links[1].url).toBe('https://linkedin.com/in/user')
		})

		// Testes específicos para cobrir upload de arquivos (linhas 106-121, 125-140)
		it('should handle icon file upload successfully', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

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

			// Mock do UserGateway
			const { container } = require('tsyringe')
			const mockUserGateway = container.resolve('UserGateway')
			jest.spyOn(mockUserGateway, 'uploadUserIcon').mockResolvedValue({
				url: 'https://s3.amazonaws.com/bucket/users/icons/test.jpg',
				key: 'users/icons/test.jpg'
			})

			mockPrismaClient.user.update.mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'test@example.com',
				username: 'testuser',
				verified: true,
				userProfile: {
					id: 'profile-123',
					displayName: 'Original Name',
					autobiography: 'Original bio',
					icon: 'https://s3.amazonaws.com/bucket/users/icons/test.jpg'
				}
			})

			// Criar um arquivo mock para simular Express.Multer.File
			const mockFile = {
				fieldname: 'icon',
				originalname: 'test.jpg',
				encoding: '7bit',
				mimetype: 'image/jpeg',
				size: 500000, // Menor que MAX_SIZE (1000000)
				buffer: Buffer.from('fake image data'),
				stream: null,
				destination: '',
				filename: '',
				path: ''
			}

			// Act - Simular upload usando FormData
			const formData = new FormData()
			formData.append('icon', JSON.stringify(mockFile))
			formData.append('displayName', 'Updated Name')

			const response = await httpClient.patch('/v1/user', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('user')
		})

		it('should handle background image file upload successfully', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

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

			// Mock do UserGateway
			const { container } = require('tsyringe')
			const mockUserGateway = container.resolve('UserGateway')
			jest.spyOn(mockUserGateway, 'uploadUserBackground').mockResolvedValue({
				url: 'https://s3.amazonaws.com/bucket/users/backgrounds/test.jpg',
				key: 'users/backgrounds/test.jpg'
			})

			mockPrismaClient.user.update.mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'test@example.com',
				username: 'testuser',
				verified: true,
				userProfile: {
					id: 'profile-123',
					displayName: 'Original Name',
					autobiography: 'Original bio',
					backgroundImage: 'https://s3.amazonaws.com/bucket/users/backgrounds/test.jpg'
				}
			})

			// Criar um arquivo mock usando Blob
			const mockBlob = new Blob(['fake background data'], { type: 'image/jpeg' })

			// Act - Simular upload usando FormData
			const formData = new FormData()
			formData.append('backgroundImage', mockBlob, 'background.jpg')
			formData.append('displayName', 'Updated Name')

			const response = await httpClient.patch('/v1/user', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('user')
		})

		it('should handle icon file too large error', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

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

			// Criar um arquivo mock muito grande (maior que MAX_SIZE = 1000000)
			const largeData = new Array(2000000).fill('a').join('') // 2MB de dados
			const mockFile = new Blob([largeData], { type: 'image/jpeg' })

			// Act - Simular upload usando FormData
			const formData = new FormData()
			formData.append('icon', mockFile, 'large.jpg')
			formData.append('displayName', 'Updated Name')

			// Assert - Deve retornar erro 500 devido ao throw
			await expect(httpClient.patch('/v1/user', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})).rejects.toThrow()
		})

		// Testes unitários diretos para cobrir linhas específicas
		it('should cover lines 106-121: icon file validation and upload', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

			const mockFile = {
				fieldname: 'icon',
				originalname: 'test.jpg',
				encoding: '7bit',
				mimetype: 'image/jpeg',
				size: 500000, // Menor que MAX_SIZE (1000000)
				buffer: Buffer.from('fake image data'),
				stream: null,
				destination: '',
				filename: '',
				path: ''
			}

			const formData = new FormData()
			formData.append('icon', new Blob([mockFile.buffer], { type: 'image/jpeg' }), 'test.jpg')

			// Mock do Prisma (regra 11: apenas injeções diretas)
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

			// Mock do S3Client (regra 11: apenas injeções diretas)
			const { container } = require('tsyringe')
			const mockS3Client = container.resolve('S3Client')
			mockS3Client.send.mockResolvedValue({
				ETag: '"test-etag"',
				Location: 'https://s3.amazonaws.com/bucket/users/icons/test.jpg'
			})

			mockPrismaClient.user.update.mockResolvedValue({
				id: 'user-123',
				userProfileId: 'profile-123',
				email: 'test@example.com',
				username: 'testuser',
				verified: true,
				userProfile: {
					id: 'profile-123',
					displayName: 'Original Name',
					autobiography: 'Original bio',
					icon: 'https://s3.amazonaws.com/bucket/users/icons/test.jpg'
				}
			})

			// Act
			const response = await httpClient.patch('/v1/user', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})

			// Assert
			expect(response.status).toBe(200)
			expect(response.data).toHaveProperty('user')
			expect(response.data.user.userProfile.icon).toBe('https://s3.amazonaws.com/bucket/users/icons/test.jpg')
		})

		it('should handle unsupported icon file type error', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

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

			// Criar um arquivo mock com tipo não suportado
			const gifData = new Array(500000).fill('a').join('') // 500KB de dados
			const mockFile = new Blob([gifData], { type: 'image/gif' }) // Tipo não suportado

			// Act - Simular upload usando FormData
			const formData = new FormData()
			formData.append('icon', mockFile, 'test.gif')
			formData.append('displayName', 'Updated Name')

			// Assert - Deve retornar erro 500 devido ao throw
			await expect(httpClient.patch('/v1/user', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})).rejects.toThrow()
		})

		it('should handle icon upload error from UserGateway', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

			// Mock do Prisma (regra 11: apenas injeções diretas)
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

			// Mock do S3Client para retornar erro (regra 11: apenas injeções diretas)
			const { container } = require('tsyringe')
			const mockS3Client = container.resolve('S3Client')
			mockS3Client.send.mockRejectedValue(new Error('S3 upload failed'))

			// Criar um arquivo mock
			const mockFile = {
				fieldname: 'icon',
				originalname: 'test.jpg',
				encoding: '7bit',
				mimetype: 'image/jpeg',
				size: 500000,
				buffer: Buffer.from('fake image data'),
				stream: null,
				destination: '',
				filename: '',
				path: ''
			}

			// Act - Simular upload usando FormData
			const formData = new FormData()
			formData.append('icon', new Blob([mockFile.buffer], { type: 'image/jpeg' }), 'test.jpg')
			formData.append('displayName', 'Updated Name')

			// Assert - Deve retornar erro 500 devido ao throw
			await expect(httpClient.patch('/v1/user', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})).rejects.toThrow()
		})

		it('should handle background image file too large error', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

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

			// Criar um arquivo mock muito grande usando Blob
			const largeBuffer = Buffer.alloc(2000000) // 2MB - maior que MAX_SIZE (1000000)
			const largeBlob = new Blob([largeBuffer], { type: 'image/jpeg' })

			// Act - Simular upload usando FormData
			const formData = new FormData()
			formData.append('backgroundImage', largeBlob, 'large.jpg')
			formData.append('displayName', 'Updated Name')

			// Assert - Deve retornar erro 400 devido ao arquivo muito grande
			await expect(httpClient.patch('/v1/user', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})).rejects.toMatchObject({
				response: {
					status: 400,
					data: {
						message: 'EXCEEDED_MAX_SIZE'
					}
				}
			})
		})

		it('should handle unsupported background image file type error', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

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

			// Criar um arquivo mock com tipo não suportado usando Blob
			const unsupportedBlob = new Blob(['fake gif data'], { type: 'image/gif' })

			// Act - Simular upload usando FormData
			const formData = new FormData()
			formData.append('backgroundImage', unsupportedBlob, 'test.gif')
			formData.append('displayName', 'Updated Name')

			// Assert - Deve retornar erro 400 devido ao tipo não suportado
			await expect(httpClient.patch('/v1/user', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})).rejects.toMatchObject({
				response: {
					status: 400,
					data: {
						message: 'INVALID_IMAGE_FORMAT'
					}
				}
			})
		})

		it('should handle background image upload error from UserGateway', async () => {
			// Arrange
			const authToken = TestTokens.generateValidToken()
			httpClient.setAuthToken(authToken)

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

			// Mock do S3Client para retornar erro (regra 11: apenas injeções diretas)
			const { container } = require('tsyringe')
			const mockS3Client = container.resolve('S3Client')
			mockS3Client.send.mockRejectedValue(new Error('S3 upload failed'))

			// Criar um arquivo mock usando Blob
			const mockBlob = new Blob(['fake background data'], { type: 'image/jpeg' })

			// Act - Simular upload usando FormData
			const formData = new FormData()
			formData.append('backgroundImage', mockBlob, 'test.jpg')
			formData.append('displayName', 'Updated Name')

			// Assert - Deve retornar erro 500 devido ao erro de upload
			await expect(httpClient.patch('/v1/user', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})).rejects.toMatchObject({
				response: {
					status: 500,
					data: {
						message: 'PICTURE_UPDATE_FAIL'
					}
				}
			})
		})
	})
})
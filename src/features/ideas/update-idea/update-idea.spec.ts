import { createTestApp } from '@test/setup/test-app'
import { App } from '@config/app'
import { TestTokens } from '@test/helpers/test-tokens'
import request from 'supertest'

describe('Update Idea Integration Tests', () => {
	let app: App
	let server: any
	let authToken: string

	beforeEach(async () => {
		app = await createTestApp()
		server = app.getInstance()

		// Gera token JWT válido para testes
		authToken = TestTokens.generateValidToken()
	})

	afterEach(async () => {
		if (app) {
			app.stop()
		}
	})

	describe('patch /api/v1/ideas/:id', () => {
		it('should update idea successfully with valid data', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'
			const updateData = {
				title: 'Updated Idea Title - This is a valid title with enough characters',
				description: 'This is an updated description with enough characters to pass validation. It needs to be at least 50 characters long and less than 700 characters.',
				tags: ['updated', 'idea'],
				links: [{ url: 'https://updated-example.com' }]
			}

			console.log('Making request to:', `/api/v1/ideas/${ideaId}`)
			console.log('With data:', updateData)

			// Act
			const response = await request(server)
				.patch(`/api/v1/ideas/${ideaId}`)
				.send(updateData)
				.set('Authorization', `Bearer ${authToken}`)

			// Debug
			console.log('Response status:', response.status)
			console.log('Response body:', response.body)
			console.log('Response headers:', response.headers)
			console.log('Auth token:', authToken)

			// Assert
			expect(response.status).toBe(200)
			expect(response.body).toHaveProperty('idea')
			expect(response.body.idea).toHaveProperty('id')
			expect(response.body.idea.title).toBe(updateData.title)
			expect(response.body.idea.description).toBe(updateData.description)
		})

		it('should return validation error for invalid UUID', async () => {
			// Arrange
			const invalidId = 'invalid-uuid'
			const updateData = {
				title: 'Updated Idea Title',
				description: 'This is an updated description with enough characters to pass validation.'
			}

			// Act
			const response = await request(server)
				.patch(`/api/v1/ideas/${invalidId}`)
				.send(updateData)
				.set('Authorization', `Bearer ${authToken}`)

			// Assert - TSOA retorna 404 para UUIDs inválidos no path
			expect(response.status).toBe(404)
		})

		it('should return validation error for short title', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'
			const updateData = {
				title: 'Short',
				description: 'This is an updated description with enough characters to pass validation.'
			}

			// Act
			const response = await request(server)
				.patch(`/api/v1/ideas/${ideaId}`)
				.send(updateData)
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(400)
			expect(response.body.message).toBe('INVALID_TITLE')
		})

		it('should return validation error for long title', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'
			const updateData = {
				title: 'A'.repeat(101), // Title too long
				description: 'This is an updated description with enough characters to pass validation.'
			}

			// Act
			const response = await request(server)
				.patch(`/api/v1/ideas/${ideaId}`)
				.send(updateData)
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(400)
			expect(response.body.message).toBe('INVALID_TITLE')
		})

		it('should return validation error for short description', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'
			const updateData = {
				title: 'Updated Idea Title',
				description: 'Short' // Description too short
			}

			// Act
			const response = await request(server)
				.patch(`/api/v1/ideas/${ideaId}`)
				.send(updateData)
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(400)
			expect(response.body.message).toBe('INVALID_DESCRIPTION')
		})

		it('should return validation error for invalid link URL', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'
			const updateData = {
				title: 'Updated Idea Title',
				description: 'This is an updated description with enough characters to pass validation.',
				links: [{ url: 'invalid-url' }]
			}

			// Act
			const response = await request(server)
				.patch(`/api/v1/ideas/${ideaId}`)
				.send(updateData)
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(400)
			expect(response.body.message).toBe('INVALID_LINK_URL')
		})

		it('should return UNAUTHORIZED when no token provided', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'
			const updateData = {
				title: 'Updated Idea Title',
				description: 'This is an updated description with enough characters to pass validation.'
			}

			// Act
			const response = await request(server)
				.patch(`/api/v1/ideas/${ideaId}`)
				.send(updateData)

			// Assert
			expect(response.status).toBe(401)
			expect(response.body.message).toBe('UNAUTHORIZED')
		})

		it('should return IDEA_NOT_FOUND when idea does not exist', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'
			const updateData = {
				title: 'Updated Idea Title',
				description: 'This is an updated description with enough characters to pass validation.'
			}

			// Act
			const response = await request(server)
				.patch(`/api/v1/ideas/${ideaId}`)
				.send(updateData)
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(404)
			expect(response.body.message).toBe('IDEA_NOT_FOUND')
		})

		it('should return FORBIDDEN when user is not the author', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'
			const updateData = {
				title: 'Updated Idea Title',
				description: 'This is an updated description with enough characters to pass validation.'
			}

			// Act
			const response = await request(server)
				.patch(`/api/v1/ideas/${ideaId}`)
				.send(updateData)
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(403)
			expect(response.body.message).toBe('FORBIDDEN')
		})

		it('should return IDEA_ALREADY_EXISTS when title already exists', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'
			const updateData = {
				title: 'Updated Idea Title',
				description: 'This is an updated description with enough characters to pass validation.'
			}

			// Act
			const response = await request(server)
				.patch(`/api/v1/ideas/${ideaId}`)
				.send(updateData)
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(409)
			expect(response.body.message).toBe('IDEA_ALREADY_EXISTS')
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'
			const updateData = {
				title: 'Updated Idea Title',
				description: 'This is an updated description with enough characters to pass validation.'
			}

			// Mock do Prisma para retornar erro
			const mockPrisma = require('@prisma/client').PrismaClient
			const originalMock = mockPrisma.mockImplementation
			
			mockPrisma.mockImplementation(() => ({
				...mockPrisma(),
				idea: {
					findUnique: jest.fn().mockRejectedValue(new Error('Database connection failed'))
				}
			}))

			// Act
			const response = await request(server)
				.patch(`/api/v1/ideas/${ideaId}`)
				.send(updateData)
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(500)

			// Restore original mock
			mockPrisma.mockImplementation = originalMock
		})
	})
})
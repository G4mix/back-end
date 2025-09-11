import { createTestApp } from '@test/setup/test-app'
import { App } from '@config/app'
import { TestTokens } from '@test/helpers/test-tokens'
import request from 'supertest'

describe('Delete Idea Integration Tests', () => {
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

	describe('DELETE /api/v1/ideas/:id', () => {
		it('should delete idea successfully', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'

			// Act
			const response = await request(server)
				.delete(`/api/v1/ideas/${ideaId}`)
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(200)
			expect(response.body.message).toBe('IDEA_DELETED')
		})

		it('should return validation error for invalid UUID', async () => {
			// Arrange
			const invalidId = 'invalid-uuid'

			// Act
			const response = await request(server)
				.delete(`/api/v1/ideas/${invalidId}`)
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(400)
			expect(response.body.message).toBe('INVALID_IDEA_ID')
		})

		it('should return UNAUTHORIZED when no token provided', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'

			// Act
			const response = await request(server)
				.delete(`/api/v1/ideas/${ideaId}`)

			// Assert
			expect(response.status).toBe(401)
			expect(response.body.message).toBe('UNAUTHORIZED')
		})

		it('should return IDEA_NOT_FOUND when idea does not exist', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'

			// Act
			const response = await request(server)
				.delete(`/api/v1/ideas/${ideaId}`)
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(404)
			expect(response.body.message).toBe('IDEA_NOT_FOUND')
		})

		it('should return FORBIDDEN when user is not the author', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'

			// Act
			const response = await request(server)
				.delete(`/api/v1/ideas/${ideaId}`)
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(403)
			expect(response.body.message).toBe('FORBIDDEN')
		})

		it('should delete idea with all related data', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'

			// Act
			const response = await request(server)
				.delete(`/api/v1/ideas/${ideaId}`)
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(200)
			expect(response.body.message).toBe('IDEA_DELETED')
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const ideaId = '123e4567-e89b-12d3-a456-426614174000'

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
				.delete(`/api/v1/ideas/${ideaId}`)
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(500)

			// Restore original mock
			mockPrisma.mockImplementation = originalMock
		})
	})
})
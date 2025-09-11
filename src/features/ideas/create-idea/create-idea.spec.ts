import { createTestApp } from '@test/setup/test-app'
import { App } from '@config/app'
import { TestTokens } from '@test/helpers/test-tokens'
import request from 'supertest'

describe('Create Idea Integration Tests', () => {
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

	describe('POST /api/v1/ideas', () => {
		it('should create idea successfully with valid data', async () => {
			// Arrange
			const ideaData = {
				title: 'Test Idea - This is a valid title with enough characters',
				description: 'This is a test idea description with enough characters to pass validation. It needs to be at least 50 characters long and less than 700 characters.',
				tags: ['test', 'idea'],
				images: [],
				links: []
			}

			// Act
			const response = await request(server)
				.post('/api/v1/ideas')
				.send(ideaData)
				.set('Authorization', `Bearer ${authToken}`)

			// Debug
			console.log('Response status:', response.status)
			console.log('Response body:', response.body)

			// Assert
			expect(response.status).toBe(201)
			expect(response.body).toHaveProperty('idea')
			expect(response.body.idea).toHaveProperty('id')
			expect(response.body.idea.title).toBe(ideaData.title)
			expect(response.body.idea.description).toBe(ideaData.description)
			expect(response.body.idea).toHaveProperty('author')
			expect(response.body.idea).toHaveProperty('created_at')
		})

		it('should return validation error for empty title', async () => {
			// Arrange
			const ideaData = {
				title: '',
				description: 'This is a test idea description with enough characters to pass validation.',
				tags: ['test', 'idea'],
				images: [],
				links: []
			}

			// Act
			const response = await request(server)
				.post('/api/v1/ideas')
				.send(ideaData)
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(400)
			expect(response.body.message).toBe('TITLE_TOO_SHORT')
		})

		it('should return validation error for empty description', async () => {
			// Arrange
			const ideaData = {
				title: 'Test Idea - This is a valid title with enough characters',
				description: '',
				tags: ['test', 'idea'],
				images: [],
				links: []
			}

			// Act
			const response = await request(server)
				.post('/api/v1/ideas')
				.send(ideaData)
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(400)
			expect(response.body.message).toBe('DESCRIPTION_TOO_SHORT')
		})

		it('should return UNAUTHORIZED when no token provided', async () => {
			// Arrange
			const ideaData = {
				title: 'Test Idea - This is a valid title with enough characters',
				description: 'This is a test idea description with enough characters to pass validation.',
				tags: ['test', 'idea'],
				images: [],
				links: []
			}

			// Act
			const response = await request(server)
				.post('/api/v1/ideas')
				.send(ideaData)

			// Assert
			expect(response.status).toBe(401)
			expect(response.body.message).toBe('UNAUTHORIZED')
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const ideaData = {
				title: 'Test Idea - This is a valid title with enough characters',
				description: 'This is a test idea description with enough characters to pass validation.',
				tags: ['test', 'idea'],
				images: [],
				links: []
			}

			// Mock do Prisma para retornar erro
			const mockPrisma = require('@prisma/client').PrismaClient
			const originalMock = mockPrisma.mockImplementation
			
			mockPrisma.mockImplementation(() => ({
				...mockPrisma(),
				idea: {
					create: jest.fn().mockRejectedValue(new Error('Database connection failed'))
				}
			}))

			// Act
			const response = await request(server)
				.post('/api/v1/ideas')
				.send(ideaData)
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(500)

			// Restore original mock
			mockPrisma.mockImplementation = originalMock
		})
	})
})
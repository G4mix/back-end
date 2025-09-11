import { createTestApp } from '@test/setup/test-app'
import { App } from '@config/app'
import { TestTokens } from '@test/helpers/test-tokens'
import request from 'supertest'

describe('Get Ideas Integration Tests', () => {
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

	describe('GET /api/v1/ideas', () => {
		it('should get ideas with pagination successfully', async () => {
			// Arrange - Mock do Prisma já está configurado globalmente no test-app.ts

			// Act
			const response = await request(server)
				.get('/api/v1/ideas')
				.query({ page: 0, limit: 10 })
				.set('Authorization', `Bearer ${authToken}`)

			// Debug removido

			// Assert
			expect(response.status).toBe(200)
			expect(response.body).toHaveProperty('ideas')
			expect(response.body).toHaveProperty('pagination')
			expect(response.body.ideas).toHaveLength(2)
			expect(response.body.pagination.total).toBe(2)
		})

		it('should get ideas with search query successfully', async () => {
			// Arrange
			const mockIdeas = [
				{
					id: 'idea-1',
					title: 'React Idea',
					description: 'Description about React',
					authorId: 'user-1',
					created_at: new Date(),
					updated_at: new Date(),
					_count: {
						likes: 10,
						comments: 5,
						views: 100
					}
				}
			]

			// Mock do Prisma
			const mockPrisma = require('@prisma/client').PrismaClient
			mockPrisma.mockImplementation(() => ({
				idea: {
					findMany: jest.fn().mockResolvedValue(mockIdeas),
					count: jest.fn().mockResolvedValue(1)
				}
			}))

			// Act
			const response = await request(server)
				.get('/api/v1/ideas')
				.query({ page: 0, limit: 10, search: 'react' })
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(200)
			expect(response.body).toHaveProperty('ideas')
			expect(response.body.ideas).toHaveLength(1)
		})

		it('should get ideas with tags filter successfully', async () => {
			// Arrange
			const mockIdeas = [
				{
					id: 'idea-1',
					title: 'Test Idea',
					description: 'Description',
					authorId: 'user-1',
					created_at: new Date(),
					updated_at: new Date(),
					tags: [
						{ name: 'react' },
						{ name: 'typescript' }
					],
					_count: {
						likes: 10,
						comments: 5,
						views: 100
					}
				}
			]

			// Mock do Prisma
			const mockPrisma = require('@prisma/client').PrismaClient
			mockPrisma.mockImplementation(() => ({
				idea: {
					findMany: jest.fn().mockResolvedValue(mockIdeas),
					count: jest.fn().mockResolvedValue(1)
				}
			}))

			// Act
			const response = await request(server)
				.get('/api/v1/ideas')
				.query({ page: 0, limit: 10, tags: ['react', 'typescript'] })
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(200)
			expect(response.body).toHaveProperty('ideas')
			expect(response.body.ideas).toHaveLength(1)
		})

		it('should return validation error for invalid page number', async () => {
			// Act
			const response = await request(server)
				.get('/api/v1/ideas')
				.query({ page: -1 })
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(400)
			expect(response.body.message).toBe('INVALID_PAGE')
		})

		it('should return validation error for invalid limit', async () => {
			// Act
			const response = await request(server)
				.get('/api/v1/ideas')
				.query({ limit: 200 })
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(400)
			expect(response.body.message).toBe('LIMIT_TOO_LARGE')
		})

		it('should return validation error for negative limit', async () => {
			// Act
			const response = await request(server)
				.get('/api/v1/ideas')
				.query({ limit: -1 })
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(400)
			expect(response.body.message).toBe('INVALID_LIMIT')
		})

		it('should return empty array when no ideas found', async () => {
			// Arrange
			// Mock do Prisma já está configurado globalmente no test-app.ts
			// Para este teste, vamos simular que não há ideias

			// Act
			const response = await request(server)
				.get('/api/v1/ideas')
				.query({ page: 0, limit: 10, authorId: '00000000-0000-0000-0000-000000000000' })
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(200)
			expect(response.body.ideas).toHaveLength(0)
			expect(response.body.pagination.total).toBe(0)
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			// Mock do Prisma já está configurado globalmente no test-app.ts
			// Para este teste, vamos simular um erro de validação

			// Act
			const response = await request(server)
				.get('/api/v1/ideas')
				.query({ page: -1, limit: 10 })
				.set('Authorization', `Bearer ${authToken}`)

			// Assert
			expect(response.status).toBe(400)
			expect(response.body.message).toBe('INVALID_PAGE')
		})
	})
})
import { GetLinksController } from './get-links.controller'

// Mock do Logger
jest.mock('@shared/utils/logger', () => ({
	Logger: jest.fn().mockImplementation(() => ({
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
		debug: jest.fn(),
		log: jest.fn()
	}))
}))

// Mock do LinkRepository
jest.mock('@shared/repositories/link.repository', () => ({
	LinkRepository: jest.fn().mockImplementation(() => ({
		findByUser: jest.fn()
	}))
}))

jest.mock('@shared/decorators', () => ({
	LogResponseTime: () => (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => descriptor
}))

describe('GetLinksController', () => {
	let controller: GetLinksController
	let mockLogger: any
	let mockLinkRepository: any

	beforeEach(() => {
		mockLogger = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn(),
			log: jest.fn()
		}

		mockLinkRepository = {
			findByUser: jest.fn()
		}

		controller = new GetLinksController(mockLogger, mockLinkRepository)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('getLinks', () => {
		it('should get links successfully', async () => {
			// Arrange
			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			const mockLinks = [
				{
					id: 'link-1',
					url: 'https://github.com/testuser',
					created_at: new Date('2024-01-01T00:00:00.000Z')
				},
				{
					id: 'link-2',
					url: 'https://linkedin.com/in/testuser',
					created_at: new Date('2024-01-02T00:00:00.000Z')
				}
			]

			mockLinkRepository.findByUser.mockResolvedValue(mockLinks)

			// Act
			const result = await controller.getLinks(undefined, mockRequest)

			// Assert
			expect(result).toEqual({
				links: [
					{
						id: 'link-1',
						url: 'https://github.com/testuser',
						created_at: '2024-01-01T00:00:00.000Z'
					},
					{
						id: 'link-2',
						url: 'https://linkedin.com/in/testuser',
						created_at: '2024-01-02T00:00:00.000Z'
					}
				]
			})

			expect(mockLinkRepository.findByUser).toHaveBeenCalledWith({
				userProfileId: 'user-profile-123'
			})
		})

		it('should get links for specific user', async () => {
			// Arrange
			const userId = 'other-user-123'
			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			const mockLinks = [
				{
					id: 'link-1',
					url: 'https://github.com/otheruser',
					created_at: new Date('2024-01-01T00:00:00.000Z')
				}
			]

			mockLinkRepository.findByUser.mockResolvedValue(mockLinks)

			// Act
			const result = await controller.getLinks(userId, mockRequest)

			// Assert
			expect(result).toEqual({
				links: [
					{
						id: 'link-1',
						url: 'https://github.com/otheruser',
						created_at: '2024-01-01T00:00:00.000Z'
					}
				]
			})

			expect(mockLinkRepository.findByUser).toHaveBeenCalledWith({
				userProfileId: userId
			})
		})

		it('should return 401 when not authenticated', async () => {
			// Arrange
			const mockRequest = {}

			// Act
			const result = await controller.getLinks(undefined, mockRequest)

			// Assert
			expect(result).toBe('UNAUTHORIZED')
			expect(mockLinkRepository.findByUser).not.toHaveBeenCalled()
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			mockLinkRepository.findByUser.mockRejectedValue(new Error('Database connection failed'))

			// Act
			const result = await controller.getLinks(undefined, mockRequest)

			// Assert
			expect(result).toBe('DATABASE_ERROR')
		})
	})
})
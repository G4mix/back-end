import { AddLinkController } from './add-link.controller'

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
		create: jest.fn()
	}))
}))

jest.mock('@shared/decorators', () => ({
	LogResponseTime: () => (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => descriptor
}))

describe('AddLinkController', () => {
	let controller: AddLinkController
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
			create: jest.fn()
		}

		controller = new AddLinkController(mockLogger, mockLinkRepository)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('addLink', () => {
		it('should add link successfully', async () => {
			// Arrange
			const linkData = {
				url: 'https://github.com/testuser'
			}

			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			const mockCreatedLink = {
				id: 'link-uuid-123',
				url: linkData.url,
				created_at: new Date('2024-01-01T00:00:00.000Z')
			}

			mockLinkRepository.create.mockResolvedValue(mockCreatedLink)

			// Act
			const result = await controller.addLink(linkData, mockRequest)

			// Assert
			expect(result).toEqual({
				link: {
					id: 'link-uuid-123',
					url: 'https://github.com/testuser',
					created_at: expect.any(String)
				}
			})

			expect(mockLinkRepository.create).toHaveBeenCalledWith({
				url: linkData.url,
				userProfileId: 'user-profile-123'
			})
		})

		it('should return 401 when not authenticated', async () => {
			// Arrange
			const linkData = {
				url: 'https://github.com/testuser'
			}

			const mockRequest = {}

			// Act
			const result = await controller.addLink(linkData, mockRequest)

			// Assert
			expect(result).toBe('UNAUTHORIZED')
			expect(mockLinkRepository.create).not.toHaveBeenCalled()
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const linkData = {
				url: 'https://github.com/testuser'
			}

			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			mockLinkRepository.create.mockRejectedValue(new Error('Database connection failed'))

			// Act
			const result = await controller.addLink(linkData, mockRequest)

			// Assert
			expect(result).toBe('DATABASE_ERROR')
		})
	})
})
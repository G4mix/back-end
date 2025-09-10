import { RemoveLinkController } from './remove-link.controller'

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
		findByUserAndId: jest.fn(),
		delete: jest.fn()
	}))
}))

jest.mock('@shared/decorators', () => ({
	LogResponseTime: () => (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => descriptor
}))

describe('RemoveLinkController', () => {
	let controller: RemoveLinkController
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
			findByUserAndId: jest.fn(),
			delete: jest.fn()
		}

		controller = new RemoveLinkController(mockLogger, mockLinkRepository)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('removeLink', () => {
		it('should remove link successfully', async () => {
			// Arrange
			const linkId = 'link-uuid-123'
			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			const mockLink = {
				id: linkId,
				url: 'https://github.com/testuser',
				userProfileId: 'user-profile-123'
			}

			mockLinkRepository.findByUserAndId.mockResolvedValue(mockLink)
			mockLinkRepository.delete.mockResolvedValue({})

			// Act
			const result = await controller.removeLink(linkId, mockRequest)

			// Assert
			expect(result).toBe('Link removed successfully')

			expect(mockLinkRepository.findByUserAndId).toHaveBeenCalledWith({
				linkId,
				userProfileId: 'user-profile-123'
			})
			expect(mockLinkRepository.delete).toHaveBeenCalledWith({
				id: linkId
			})
		})

		it('should return 401 when not authenticated', async () => {
			// Arrange
			const linkId = 'link-uuid-123'
			const mockRequest = {}

			// Act
			const result = await controller.removeLink(linkId, mockRequest)

			// Assert
			expect(result).toBe('UNAUTHORIZED')
			expect(mockLinkRepository.findByUserAndId).not.toHaveBeenCalled()
		})

		it('should return 404 for non-existent link', async () => {
			// Arrange
			const linkId = 'link-uuid-123'
			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			mockLinkRepository.findByUserAndId.mockResolvedValue(null)

			// Act
			const result = await controller.removeLink(linkId, mockRequest)

			// Assert
			expect(result).toBe('LINK_NOT_FOUND')
			expect(mockLinkRepository.delete).not.toHaveBeenCalled()
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const linkId = 'link-uuid-123'
			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			mockLinkRepository.findByUserAndId.mockRejectedValue(new Error('Database connection failed'))

			// Act
			const result = await controller.removeLink(linkId, mockRequest)

			// Assert
			expect(result).toBe('DATABASE_ERROR')
		})
	})
})
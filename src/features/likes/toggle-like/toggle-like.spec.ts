import { ToggleLikeController } from './toggle-like.controller'

jest.mock('@shared/utils/logger', () => ({
	Logger: jest.fn().mockImplementation(() => ({
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
		debug: jest.fn(),
		log: jest.fn()
	}))
}))

jest.mock('@shared/decorators', () => ({
	LogResponseTime: () => (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => descriptor
}))

describe('ToggleLikeController', () => {
	let controller: ToggleLikeController
	let mockLogger: any

	beforeEach(() => {
		mockLogger = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn(),
			log: jest.fn()
		}

		controller = new ToggleLikeController(mockLogger)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('toggleLike', () => {
		it('should return UNAUTHORIZED when user is not authenticated', async () => {
			// Arrange
			const likeData = {
				ideaId: 'idea-uuid-123'
			}
			const mockRequest = {}

			// Act
			const result = await controller.toggleLike(likeData, mockRequest)

			// Assert
			expect(result).toBe('UNAUTHORIZED')
		})

		it('should return UNAUTHORIZED when user sub is missing', async () => {
			// Arrange
			const likeData = {
				ideaId: 'idea-uuid-123'
			}
			const mockRequest = {
				user: {}
			}

			// Act
			const result = await controller.toggleLike(likeData, mockRequest)

			// Assert
			expect(result).toBe('UNAUTHORIZED')
		})
	})
})

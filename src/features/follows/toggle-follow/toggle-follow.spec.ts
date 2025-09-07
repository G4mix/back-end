import { ToggleFollowController } from './toggle-follow.controller'

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

describe('ToggleFollowController', () => {
	let controller: ToggleFollowController
	let mockLogger: any

	beforeEach(() => {
		mockLogger = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn(),
			log: jest.fn()
		}

		controller = new ToggleFollowController(mockLogger)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('toggleFollow', () => {
		it('should return UNAUTHORIZED when user is not authenticated', async () => {
			// Arrange
			const followData = {
				followingId: 'user-profile-456',
				followingType: 'user' as const
			}
			const mockRequest = {}

			// Act
			const result = await controller.toggleFollow(followData, mockRequest)

			// Assert
			expect(result).toBe('UNAUTHORIZED')
		})

		it('should return UNAUTHORIZED when user sub is missing', async () => {
			// Arrange
			const followData = {
				followingId: 'user-profile-456',
				followingType: 'user' as const
			}
			const mockRequest = {
				user: {}
			}

			// Act
			const result = await controller.toggleFollow(followData, mockRequest)

			// Assert
			expect(result).toBe('UNAUTHORIZED')
		})
	})
})

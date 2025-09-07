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

jest.mock('@shared/repositories/follow.repository', () => ({
	FollowRepository: jest.fn().mockImplementation(() => ({
		findFollow: jest.fn(),
		follow: jest.fn(),
		unfollow: jest.fn()
	}))
}))

jest.mock('@shared/repositories/user.repository', () => ({
	UserRepository: jest.fn().mockImplementation(() => ({
		findById: jest.fn()
	}))
}))

describe('ToggleFollowController', () => {
	let controller: ToggleFollowController
	let mockLogger: any
	let mockFollowRepository: any
	let mockUserRepository: any

	beforeEach(() => {
		mockLogger = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn(),
			log: jest.fn()
		}

		mockFollowRepository = {
			findFollow: jest.fn(),
			follow: jest.fn(),
			unfollow: jest.fn()
		}

		mockUserRepository = {
			findById: jest.fn()
		}

		controller = new ToggleFollowController(mockLogger, mockFollowRepository, mockUserRepository)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('toggleFollow', () => {
		it('should return UNAUTHORIZED when user is not authenticated', async () => {
			// Arrange
			const followData = {
				followingId: 'user-profile-456'
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
				followingId: 'user-profile-456'
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

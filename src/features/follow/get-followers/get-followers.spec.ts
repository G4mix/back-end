import { GetFollowersController } from './get-followers.controller'

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

// Mock do FollowRepository
jest.mock('@shared/repositories/follow.repository', () => ({
	FollowRepository: jest.fn().mockImplementation(() => ({
		findFollowers: jest.fn()
	}))
}))

jest.mock('@shared/decorators', () => ({
	LogResponseTime: () => (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => descriptor
}))

describe('GetFollowersController', () => {
	let controller: GetFollowersController
	let mockLogger: any
	let mockFollowRepository: any

	beforeEach(() => {
		mockLogger = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn(),
			log: jest.fn()
		}

		mockFollowRepository = {
			findFollowers: jest.fn()
		}

		controller = new GetFollowersController(mockLogger, mockFollowRepository)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('getFollowers', () => {
		it('should get followers successfully', async () => {
			// Arrange
			const userId = 'user-profile-123'
			const mockRequest = {
				user: { userProfileId: 'current-user-123' }
			}

			const mockFollowers = [
				{
					id: 'follow-1',
					followerUser: {
						id: 'follower-1',
						displayName: 'Follower One',
						icon: 'https://example.com/icon1.jpg',
						user: { username: 'follower1' }
					},
					created_at: new Date('2024-01-01T00:00:00.000Z')
				},
				{
					id: 'follow-2',
					followerUser: {
						id: 'follower-2',
						displayName: 'Follower Two',
						icon: 'https://example.com/icon2.jpg',
						user: { username: 'follower2' }
					},
					created_at: new Date('2024-01-02T00:00:00.000Z')
				}
			]

			mockFollowRepository.findFollowers.mockResolvedValue({
				followers: mockFollowers,
				total: 2
			})

			// Act
			const result = await controller.getFollowers(userId, 0, 10, mockRequest)

			// Assert
			expect(result).toEqual({
				followers: [
					{
						id: 'follow-1',
						followerUser: {
							id: 'follower-1',
							displayName: 'Follower One',
							icon: 'https://example.com/icon1.jpg',
							username: 'follower1'
						},
						created_at: '2024-01-01T00:00:00.000Z'
					},
					{
						id: 'follow-2',
						followerUser: {
							id: 'follower-2',
							displayName: 'Follower Two',
							icon: 'https://example.com/icon2.jpg',
							username: 'follower2'
						},
						created_at: '2024-01-02T00:00:00.000Z'
					}
				],
				pagination: {
					page: 0,
					limit: 10,
					total: 2,
					totalPages: 1,
					hasNext: false,
					hasPrev: false
				}
			})

			expect(mockFollowRepository.findFollowers).toHaveBeenCalledWith({
				userId,
				page: 0,
				limit: 10
			})
		})

		it('should return 401 when not authenticated', async () => {
			// Arrange
			const userId = 'user-profile-123'
			const mockRequest = {}

			// Act
			const result = await controller.getFollowers(userId, 0, 10, mockRequest)

			// Assert
			expect(result).toBe('UNAUTHORIZED')
			expect(mockFollowRepository.findFollowers).not.toHaveBeenCalled()
		})

		it('should handle pagination correctly', async () => {
			// Arrange
			const userId = 'user-profile-123'
			const mockRequest = {
				user: { userProfileId: 'current-user-123' }
			}

			mockFollowRepository.findFollowers.mockResolvedValue({
				followers: [],
				total: 25
			})

			// Act
			const result = await controller.getFollowers(userId, 1, 5, mockRequest)

			// Assert
			expect(result).toEqual({
				followers: [],
				pagination: {
					page: 1,
					limit: 5,
					total: 25,
					totalPages: 5,
					hasNext: true,
					hasPrev: true
				}
			})

			expect(mockFollowRepository.findFollowers).toHaveBeenCalledWith({
				userId,
				page: 1,
				limit: 5
			})
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const userId = 'user-profile-123'
			const mockRequest = {
				user: { userProfileId: 'current-user-123' }
			}

			mockFollowRepository.findFollowers.mockRejectedValue(new Error('Database connection failed'))

			// Act
			const result = await controller.getFollowers(userId, 0, 10, mockRequest)

			// Assert
			expect(result).toBe('DATABASE_ERROR')
		})
	})
})
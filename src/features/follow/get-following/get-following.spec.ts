import { GetFollowingController } from './get-following.controller'

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
		findFollowing: jest.fn()
	}))
}))

jest.mock('@shared/decorators', () => ({
	LogResponseTime: () => (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => descriptor
}))

describe('GetFollowingController', () => {
	let controller: GetFollowingController
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
			findFollowing: jest.fn()
		}

		controller = new GetFollowingController(mockLogger, mockFollowRepository)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('getFollowing', () => {
		it('should get following successfully', async () => {
			// Arrange
			const userId = 'user-profile-123'
			const mockRequest = {
				user: { userProfileId: 'current-user-123' }
			}

			const mockFollowing = [
				{
					id: 'follow-1',
					followingUser: {
						id: 'following-1',
						displayName: 'Following One',
						icon: 'https://example.com/icon1.jpg',
						user: { username: 'following1' }
					},
					created_at: new Date('2024-01-01T00:00:00.000Z')
				},
				{
					id: 'follow-2',
					followingUser: {
						id: 'following-2',
						displayName: 'Following Two',
						icon: 'https://example.com/icon2.jpg',
						user: { username: 'following2' }
					},
					created_at: new Date('2024-01-02T00:00:00.000Z')
				}
			]

			mockFollowRepository.findFollowing.mockResolvedValue({
				following: mockFollowing,
				total: 2
			})

			// Act
			const result = await controller.getFollowing(userId, 0, 10, mockRequest)

			// Assert
			expect(result).toEqual({
				following: [
					{
						id: 'follow-1',
						followingUser: {
							id: 'following-1',
							displayName: 'Following One',
							icon: 'https://example.com/icon1.jpg',
							username: 'following1'
						},
						created_at: '2024-01-01T00:00:00.000Z'
					},
					{
						id: 'follow-2',
						followingUser: {
							id: 'following-2',
							displayName: 'Following Two',
							icon: 'https://example.com/icon2.jpg',
							username: 'following2'
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

			expect(mockFollowRepository.findFollowing).toHaveBeenCalledWith({
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
			const result = await controller.getFollowing(userId, 0, 10, mockRequest)

			// Assert
			expect(result).toBe('UNAUTHORIZED')
			expect(mockFollowRepository.findFollowing).not.toHaveBeenCalled()
		})

		it('should handle pagination correctly', async () => {
			// Arrange
			const userId = 'user-profile-123'
			const mockRequest = {
				user: { userProfileId: 'current-user-123' }
			}

			mockFollowRepository.findFollowing.mockResolvedValue({
				following: [],
				total: 15
			})

			// Act
			const result = await controller.getFollowing(userId, 1, 5, mockRequest)

			// Assert
			expect(result).toEqual({
				following: [],
				pagination: {
					page: 1,
					limit: 5,
					total: 15,
					totalPages: 3,
					hasNext: true,
					hasPrev: true
				}
			})

			expect(mockFollowRepository.findFollowing).toHaveBeenCalledWith({
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

			mockFollowRepository.findFollowing.mockRejectedValue(new Error('Database connection failed'))

			// Act
			const result = await controller.getFollowing(userId, 0, 10, mockRequest)

			// Assert
			expect(result).toBe('DATABASE_ERROR')
		})
	})
})
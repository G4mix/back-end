import { GetIdeasController } from './get-ideas.controller'

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

describe('GetIdeasController', () => {
	let controller: GetIdeasController
	let mockLogger: any
	let mockIdeaRepository: any

	beforeEach(() => {
		mockLogger = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn(),
			log: jest.fn()
		}

		mockIdeaRepository = {
			findAll: jest.fn()
		}

		controller = new GetIdeasController(mockLogger, mockIdeaRepository)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('getIdeas', () => {
		it('should return UNAUTHORIZED when user is not authenticated', async () => {
			// Arrange
			const mockRequest = {}

			// Act
			const result = await controller.getIdeas(
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				mockRequest
			)

			// Assert
			expect(result).toBe('UNAUTHORIZED')
		})

		it('should return UNAUTHORIZED when user sub is missing', async () => {
			// Arrange
			const mockRequest = {
				user: {}
			}

			// Act
			const result = await controller.getIdeas(
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				mockRequest
			)

			// Assert
			expect(result).toBe('UNAUTHORIZED')
		})
	})
})

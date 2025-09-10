import { RecordViewController } from './record-view.controller'

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

describe('RecordViewController', () => {
	let controller: RecordViewController
	let mockLogger: any
	let mockViewRepository: any
	let mockIdeaRepository: any

	beforeEach(() => {
		mockLogger = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn(),
			log: jest.fn()
		}

		mockViewRepository = {
			createMany: jest.fn(),
			getCount: jest.fn()
		}

		mockIdeaRepository = {
			findById: jest.fn()
		}

		controller = new RecordViewController(mockLogger, mockViewRepository, mockIdeaRepository)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('recordView', () => {
		it('should return UNAUTHORIZED when user is not authenticated', async () => {
			// Arrange
			const viewData = {
				ideaId: 'idea-uuid-123'
			}
			const mockRequest = {}

			// Act
			const result = await controller.recordView({ ideas: [viewData.ideaId] }, mockRequest)

			// Assert
			expect(result).toBe('UNAUTHORIZED')
		})

		it('should return UNAUTHORIZED when user sub is missing', async () => {
			// Arrange
			const viewData = {
				ideaId: 'idea-uuid-123'
			}
			const mockRequest = {
				user: {}
			}

			// Act
			const result = await controller.recordView({ ideas: [viewData.ideaId] }, mockRequest)

			// Assert
			expect(result).toBe('UNAUTHORIZED')
		})
	})
})

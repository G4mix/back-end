import { CreateIdeaController } from './create-idea.controller'

// Mock do Express.Multer.File
const createMockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
	fieldname: 'images',
	originalname: 'test-image.jpg',
	encoding: '7bit',
	mimetype: 'image/jpeg',
	buffer: Buffer.from('fake-image-data'),
	size: 1024,
	stream: null as any,
	destination: '',
	filename: '',
	path: '',
	...overrides
})

// Mock completo do Prisma Client
jest.mock('@prisma/client', () => ({
	PrismaClient: jest.fn().mockImplementation(() => ({
		idea: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn()
		},
		userProfile: {
			findUnique: jest.fn(),
			findMany: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn()
		}
	})),
	Prisma: {
		QueryMode: {
			insensitive: 'insensitive'
		}
	}
}))

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

// Mock do IdeaGateway
jest.mock('@shared/gateways/idea.gateway', () => ({
	IdeaGateway: jest.fn().mockImplementation(() => ({
		uploadIdeaImages: jest.fn(),
		deleteIdeaImages: jest.fn()
	}))
}))

describe('CreateIdeaController', () => {
	let controller: CreateIdeaController
	let mockLogger: any
	let mockIdeaRepository: any
	let mockIdeaGateway: any

	beforeEach(() => {
		mockLogger = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn(),
			log: jest.fn()
		}

		mockIdeaRepository = {
			create: jest.fn(),
			findById: jest.fn(),
			findByTitle: jest.fn()
		}

		mockIdeaGateway = {
			uploadIdeaImages: jest.fn(),
			deleteIdeaImages: jest.fn()
		}

		controller = new CreateIdeaController(mockLogger, mockIdeaRepository, mockIdeaGateway)
	})

	describe('createIdea', () => {
		it('should create idea successfully', async () => {
			// Arrange
			const ideaData = {
				title: 'Revolutionary Mobile App Idea',
				description: 'A detailed description of the mobile app concept that will revolutionize the way people interact with technology. This app will provide innovative features and user experience improvements.'
			}

			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			const mockCreatedIdea = {
				id: 'idea-uuid-123',
				title: ideaData.title,
				description: ideaData.description,
				authorId: mockRequest.user.userProfileId,
				created_at: new Date(),
				updated_at: new Date()
			}

			mockIdeaRepository.findByTitle.mockResolvedValue(null)
			mockIdeaGateway.uploadIdeaImages.mockResolvedValue([])
			mockIdeaRepository.create.mockResolvedValue(mockCreatedIdea)

			// Act
			const result = await controller.createIdea(ideaData, mockRequest)

			// Assert
			expect(result).toEqual({
				idea: {
					id: 'idea-uuid-123',
					title: 'Revolutionary Mobile App Idea',
					description: 'A detailed description of the mobile app concept that will revolutionize the way people interact with technology. This app will provide innovative features and user experience improvements.',
					authorId: 'user-profile-123',
					created_at: expect.any(String),
					updated_at: expect.any(String)
				}
			})

			expect(mockIdeaRepository.findByTitle).toHaveBeenCalledWith(ideaData.title)
			expect(mockIdeaRepository.create).toHaveBeenCalledWith({
				title: ideaData.title,
				description: ideaData.description,
				authorId: 'user-profile-123',
				tags: undefined,
				images: undefined,
				links: undefined
			})
		})

		it('should create idea with tags, images and links', async () => {
			// Arrange
			const ideaData = {
				title: 'Revolutionary Mobile App Idea',
				description: 'A detailed description of the mobile app concept that will revolutionize the way people interact with technology. This app will provide innovative features and user experience improvements.',
				tags: ['mobile', 'innovation', 'technology'],
				images: [
					createMockFile({
						originalname: 'app-mockup.jpg'
					})
				],
				links: [
					{ url: 'https://github.com/example/app' },
					{ url: 'https://example.com/demo' }
				]
			}

			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			const mockCreatedIdea = {
				id: 'idea-uuid-123',
				title: ideaData.title,
				description: ideaData.description,
				authorId: mockRequest.user.userProfileId,
				tags: [
					{ id: 'tag-1', name: 'mobile' },
					{ id: 'tag-2', name: 'innovation' },
					{ id: 'tag-3', name: 'technology' }
				],
				images: [
					{
						id: 'img-1',
						src: 'https://gamix-app-prod.s3.amazonaws.com/ideas/fake-image.jpg',
						alt: 'app-mockup.jpg',
						width: 800,
						height: 600
					}
				],
				links: [
					{ id: 'link-1', url: 'https://github.com/example/app' },
					{ id: 'link-2', url: 'https://example.com/demo' }
				],
				created_at: new Date(),
				updated_at: new Date()
			}

			const mockProcessedImages = [
				{
					src: 'https://gamix-app-prod.s3.amazonaws.com/ideas/fake-image.jpg',
					alt: 'app-mockup.jpg',
					width: 800,
					height: 600
				}
			]

			mockIdeaRepository.findByTitle.mockResolvedValue(null)
			mockIdeaGateway.uploadIdeaImages.mockResolvedValue(mockProcessedImages)
			mockIdeaRepository.create.mockResolvedValue(mockCreatedIdea)

			// Act
			const result = await controller.createIdea(ideaData, mockRequest)

			// Assert
			expect(result).toEqual({
				idea: {
					id: 'idea-uuid-123',
					title: 'Revolutionary Mobile App Idea',
					description: 'A detailed description of the mobile app concept that will revolutionize the way people interact with technology. This app will provide innovative features and user experience improvements.',
					authorId: 'user-profile-123',
					tags: [
						{ id: 'tag-1', name: 'mobile' },
						{ id: 'tag-2', name: 'innovation' },
						{ id: 'tag-3', name: 'technology' }
					],
					images: [
						{
							id: 'img-1',
							src: 'https://gamix-app-prod.s3.amazonaws.com/ideas/fake-image.jpg',
							alt: 'app-mockup.jpg',
							width: 800,
							height: 600
						}
					],
					links: [
						{ id: 'link-1', url: 'https://github.com/example/app' },
						{ id: 'link-2', url: 'https://example.com/demo' }
					],
					created_at: expect.any(String),
					updated_at: expect.any(String)
				}
			})

			expect(mockIdeaGateway.uploadIdeaImages).toHaveBeenCalledWith({
				files: ideaData.images
			})
			expect(mockIdeaRepository.create).toHaveBeenCalledWith({
				title: ideaData.title,
				description: ideaData.description,
				authorId: 'user-profile-123',
				tags: ideaData.tags,
				images: mockProcessedImages,
				links: ideaData.links
			})
		})

		it('should return UNAUTHORIZED when user is not authenticated', async () => {
			// Arrange
			const ideaData = {
				title: 'Revolutionary Mobile App Idea',
				description: 'A detailed description of the mobile app concept.'
			}

			const mockRequest = {
				user: null
			}

			// Act
			const result = await controller.createIdea(ideaData, mockRequest)

			// Assert
			expect(result).toBe('UNAUTHORIZED')
			expect(mockIdeaRepository.create).not.toHaveBeenCalled()
		})

		it('should return IDEA_ALREADY_EXISTS when title already exists', async () => {
			// Arrange
			const ideaData = {
				title: 'Existing Idea Title',
				description: 'A detailed description of the mobile app concept.'
			}

			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			const existingIdea = {
				id: 'existing-idea-uuid',
				title: ideaData.title,
				description: 'Existing description',
				authorId: 'other-user-profile-123'
			}

			mockIdeaRepository.findByTitle.mockResolvedValue(existingIdea)

			// Act
			const result = await controller.createIdea(ideaData, mockRequest)

			// Assert
			expect(result).toBe('IDEA_ALREADY_EXISTS')
			expect(mockIdeaRepository.create).not.toHaveBeenCalled()
		})

		it('should handle database errors gracefully', async () => {
			// Arrange
			const ideaData = {
				title: 'Revolutionary Mobile App Idea',
				description: 'A detailed description of the mobile app concept.'
			}

			const mockRequest = {
				user: { userProfileId: 'user-profile-123' }
			}

			mockIdeaRepository.findByTitle.mockResolvedValue(null)
			mockIdeaGateway.uploadIdeaImages.mockResolvedValue([])
			mockIdeaRepository.create.mockRejectedValue(new Error('Database connection failed'))

			// Act
			const result = await controller.createIdea(ideaData, mockRequest)

			// Assert
			expect(result).toBe('Failed to create idea')
		})
	})
})
import { PrismaClient } from '@prisma/client'
import { injectable, inject } from 'tsyringe'

export interface ProcessedImage {
	src: string
	alt: string
	width: number
	height: number
}

export interface CreateIdeaInput {
	title: string
	description: string
	authorId: string
	tags?: string[]
	images?: ProcessedImage[]
	links?: Array<{
		url: string
	}>
}

export interface UpdateIdeaInput {
	title?: string
	description?: string
	tags?: string[]
	images?: ProcessedImage[]
	links?: Array<{
		url: string
	}>
}

export interface GetIdeasInput {
	search?: string
	authorId?: string
	tags?: string[]
	page?: number
	limit?: number
	sortBy?: 'created_at' | 'updated_at' | 'title'
	sortOrder?: 'asc' | 'desc'
}

@injectable()
export class IdeaRepository {
	constructor(@inject('PostgresqlClient') private prisma: PrismaClient) {}

	async create(data: CreateIdeaInput) {
		return this.prisma.idea.create({
			data: {
				...data,
				tags: data.tags ? {
					create: data.tags.map((tagName: string) => ({
						name: tagName
					}))
				} : undefined,
				images: data.images ? {
					create: data.images.map((image: any) => ({
						src: image.src,
						alt: image.alt,
						width: image.width,
						height: image.height
					}))
				} : undefined,
				links: data.links ? {
					create: data.links.map((link: any) => ({
						url: link.url
					}))
				} : undefined
			},
			include: {
				author: {
					select: {
						id: true,
						displayName: true,
						icon: true
					}
				},
				tags: {
					select: {
						id: true,
						name: true
					}
				},
				images: {
					select: {
						id: true,
						src: true,
						alt: true,
						width: true,
						height: true
					}
				},
				links: {
					select: {
						id: true,
						url: true
					}
				},
				_count: {
					select: {
						likes: true,
						views: true,
						comments: true
					}
				}
			}
		})
	}

	async findById(id: string) {
		return this.prisma.idea.findUnique({
			where: { id },
			include: {
				author: {
					select: {
						id: true,
						displayName: true,
						icon: true
					}
				},
				tags: {
					select: {
						id: true,
						name: true
					}
				},
				images: {
					select: {
						id: true,
						src: true,
						alt: true,
						width: true,
						height: true
					}
				},
				links: {
					select: {
						id: true,
						url: true
					}
				},
				_count: {
					select: {
						likes: true,
						views: true,
						comments: true
					}
				}
			}
		})
	}

	async findByTitle(title: string) {
		return this.prisma.idea.findFirst({
			where: { title }
		})
	}

	async findAll(params: GetIdeasInput) {
		const { search, authorId, tags, page = 0, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = params
		const where: any = {}
		
		if (search) {
			where.OR = [
				{ title: { contains: search, mode: 'insensitive' } },
				{ description: { contains: search, mode: 'insensitive' } }
			]
		}
		
		if (authorId) {
			where.authorId = authorId
		}
		
		if (tags && tags.length > 0) {
			where.tags = {
				some: {
					name: {
						in: tags
					}
				}
			}
		}

		const [ideas, total] = await Promise.all([
			this.prisma.idea.findMany({
				where,
				include: {
					author: {
						select: {
							id: true,
							displayName: true,
							icon: true
						}
					},
					tags: {
						select: {
							id: true,
							name: true
						}
					},
					images: {
						select: {
							id: true,
							src: true,
							alt: true,
							width: true,
							height: true
						}
					},
					_count: {
						select: {
							likes: true,
							views: true,
							comments: true
						}
					}
				},
				orderBy: { [sortBy]: sortOrder },
				skip: page * limit,
				take: limit
			}),
			this.prisma.idea.count({ where })
		])

		return { ideas, total }
	}

	async update(id: string, data: UpdateIdeaInput) {
		return this.prisma.idea.update({
			where: { id },
			data: {
				...data,
				tags: data.tags ? {
					deleteMany: {},
					create: data.tags.map((tagName: string) => ({
						name: tagName
					}))
				} : undefined,
				images: data.images ? {
					deleteMany: {},
					create: data.images.map((image: any) => ({
						src: image.src,
						alt: image.alt,
						width: image.width,
						height: image.height
					}))
				} : undefined,
				links: data.links ? {
					deleteMany: {},
					create: data.links.map((link: any) => ({
						url: link.url
					}))
				} : undefined
			},
			include: {
				author: {
					select: {
						id: true,
						displayName: true,
						icon: true
					}
				},
				tags: {
					select: {
						id: true,
						name: true
					}
				},
				images: {
					select: {
						id: true,
						src: true,
						alt: true,
						width: true,
						height: true
					}
				},
				links: {
					select: {
						id: true,
						url: true
					}
				},
				_count: {
					select: {
						likes: true,
						views: true,
						comments: true
					}
				}
			}
		})
	}

	async delete(id: string) {
		return this.prisma.idea.delete({
			where: { id }
		})
	}
}

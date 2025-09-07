import { PrismaClient } from '@prisma/client'
import { injectable } from 'tsyringe'

export interface CreateIdeaInput {
	title: string
	description: string
	authorId: string
}

export interface UpdateIdeaInput {
	title?: string
	description?: string
}

export interface GetIdeasInput {
	search?: string
	authorId?: string
	tags?: string
	page?: number
	limit?: number
	sortBy?: 'created_at' | 'updated_at' | 'title'
	sortOrder?: 'asc' | 'desc'
}

@injectable()
export class IdeaRepository {
	constructor(private prisma: PrismaClient) {}

	async create(data: CreateIdeaInput) {
		return this.prisma.idea.create({
			data,
			include: {
				author: {
					select: {
						id: true,
						displayName: true,
						icon: true
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
		
		if (tags) {
			where.tags = { contains: tags, mode: 'insensitive' }
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
					_count: {
						select: {
							likes: true,
							views: true,
							comments: true
						}
					}
				},
				orderBy: { [sortBy]: sortOrder },
				skip: (page - 1) * limit,
				take: limit
			}),
			this.prisma.idea.count({ where })
		])

		return { ideas, total }
	}

	async update(id: string, data: UpdateIdeaInput) {
		return this.prisma.idea.update({
			where: { id },
			data,
			include: {
				author: {
					select: {
						id: true,
						displayName: true,
						icon: true
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

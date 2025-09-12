import { z } from 'zod'

/**
 * Schema de parâmetros para busca de seguidores
 * Segue o padrão do middleware de validação automática
 */
export const GetFollowersParamsSchema = z.object({
	userId: z.string().uuid('INVALID_USER_ID')
})

/**
 * Schema de query para busca de seguidores
 */
export const GetFollowersQuerySchema = z.object({
	page: z.coerce.number().int().min(0, 'INVALID_PAGE').optional(),
	limit: z.coerce.number().int().min(1, 'INVALID_LIMIT').max(100, 'LIMIT_TOO_LARGE').optional()
})

/**
 * Schema de resposta para seguidor
 */
export const FollowerResponseSchema = z.object({
	id: z.string(),
	followerUser: z.object({
		id: z.string(),
		displayName: z.string().nullable(),
		icon: z.string().nullable(),
		username: z.string().optional()
	}),
	created_at: z.string()
})

/**
 * Schema de saída para busca de seguidores
 */
export const GetFollowersOutputSchema = z.object({
	followers: z.array(FollowerResponseSchema),
	pagination: z.object({
		page: z.number(),
		limit: z.number(),
		total: z.number(),
		totalPages: z.number(),
		hasNext: z.boolean(),
		hasPrev: z.boolean()
	})
})

/**
 * DTO padronizado para busca de seguidores
 * Compatível com o sistema de registro automático
 */
export const GetFollowersDTO = {
	ParamsSchema: GetFollowersParamsSchema,
	QuerySchema: GetFollowersQuerySchema,
	OutputSchema: GetFollowersOutputSchema
}

// Tipos para compatibilidade com TSOA
export interface GetFollowersQuery {
	page?: number
	limit?: number
}

export interface FollowerResponse {
	id: string
	followerUser: {
		id: string
		displayName?: string | null
		icon?: string | null
		username?: string
	}
	created_at: string
}

export interface GetFollowersResponse {
	followers: FollowerResponse[]
	pagination: {
		page: number
		limit: number
		total: number
		totalPages: number
		hasNext: boolean
		hasPrev: boolean
	}
}

import { z } from 'zod'

/**
 * Schema de parâmetros para busca de seguindo
 * Segue o padrão do middleware de validação automática
 */
export const GetFollowingParamsSchema = z.object({
	userId: z.string().uuid('INVALID_USER_ID')
})

/**
 * Schema de query para busca de seguindo
 */
export const GetFollowingQuerySchema = z.object({
	page: z.coerce.number().int().min(0, 'INVALID_PAGE').optional(),
	limit: z.coerce.number().int().min(1, 'INVALID_LIMIT').max(100, 'LIMIT_TOO_LARGE').optional()
})

/**
 * Schema de resposta para seguindo
 */
export const FollowingResponseSchema = z.object({
	id: z.string(),
	followingUser: z.object({
		id: z.string(),
		displayName: z.string().nullable(),
		icon: z.string().nullable(),
		username: z.string().optional()
	}),
	created_at: z.string()
})

/**
 * Schema de saída para busca de seguindo
 */
export const GetFollowingOutputSchema = z.object({
	following: z.array(FollowingResponseSchema),
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
 * DTO padronizado para busca de seguindo
 * Compatível com o sistema de registro automático
 */
export const GetFollowingDTO = {
	ParamsSchema: GetFollowingParamsSchema,
	QuerySchema: GetFollowingQuerySchema,
	OutputSchema: GetFollowingOutputSchema
}

// Tipos para compatibilidade com TSOA
export interface GetFollowingQuery {
	page?: number
	limit?: number
}

export interface FollowingResponse {
	id: string
	followingUser: {
		id: string
		displayName?: string | null
		icon?: string | null
		username?: string
	}
	created_at: string
}

export interface GetFollowingResponse {
	following: FollowingResponse[]
	pagination: {
		page: number
		limit: number
		total: number
		totalPages: number
		hasNext: boolean
		hasPrev: boolean
	}
}

import { z } from 'zod'

/**
 * Schema de query para busca de usuários
 * Segue o padrão do middleware de validação automática
 */
export const GetUsersQuerySchema = z.object({
	page: z.coerce.number().int().min(0, 'INVALID_PAGE').optional(),
	limit: z.coerce.number().int().min(1, 'INVALID_LIMIT').max(100, 'LIMIT_TOO_LARGE').optional(),
	search: z.string().optional()
})

/**
 * DTO padronizado para busca de usuários
 * Compatível com o sistema de registro automático
 */
export const GetUsersDTO = {
	QuerySchema: GetUsersQuerySchema
}

// Tipos para compatibilidade com TSOA
export interface GetUsersQuery {
	page?: number
	limit?: number
	search?: string
}

export interface GetUsersResponse {
	users: Array<{
		id: string
		username: string
		email: string
		verified: boolean
		created_at: string
		updated_at: string
		userProfile: {
			id: string
			icon: string | null
			displayName: string | null
			autobiography: string | null
			backgroundImage: string | null
			isFollowing: boolean
			links: string[]
			followersCount: number
			followingCount: number
		} | null
	}>
	pagination: {
		page: number
		limit: number
		total: number
		totalPages: number
		hasNext: boolean
		hasPrev: boolean
	}
}

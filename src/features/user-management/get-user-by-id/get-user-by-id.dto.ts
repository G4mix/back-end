import { z } from 'zod'

/**
 * Schema de parâmetros para busca de usuário por ID
 * Segue o padrão do middleware de validação automática
 */
export const GetUserByIdParamsSchema = z.object({
	id: z.string().uuid('INVALID_USER_ID')
})

/**
 * DTO padronizado para busca de usuário por ID
 * Compatível com o sistema de registro automático
 */
export const GetUserByIdDTO = {
	ParamsSchema: GetUserByIdParamsSchema
}

// Tipos para compatibilidade com TSOA
export interface GetUserByIdResponse {
	user: {
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
	}
}

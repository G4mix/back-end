import { z } from 'zod'

/**
 * Schema de parâmetros para busca de ideia por ID
 * Segue o padrão do middleware de validação automática
 */
export const GetIdeaByIdParamsSchema = z.object({
	id: z.string().uuid('INVALID_IDEA_ID')
})

/**
 * DTO padronizado para busca de ideia por ID
 * Compatível com o sistema de registro automático
 */
export const GetIdeaByIdDTO = {
	ParamsSchema: GetIdeaByIdParamsSchema
}

// Tipos para compatibilidade com TSOA
export interface GetIdeaByIdResponse {
	idea: {
		id: string
		title: string | null
		description: string | null
		authorId: string
		author: {
			id: string
			displayName?: string | null
			icon?: string | null
		}
		created_at: string
		updated_at: string
		_count?: {
			likes: number
			views: number
			comments: number
		}
	}
}

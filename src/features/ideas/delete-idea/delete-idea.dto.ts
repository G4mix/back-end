import { z } from 'zod'

/**
 * Schema de parâmetros para exclusão de ideia
 * Segue o padrão do middleware de validação automática
 */
export const DeleteIdeaParamsSchema = z.object({
	id: z.string().uuid('INVALID_IDEA_ID')
})

/**
 * DTO padronizado para exclusão de ideia
 * Compatível com o sistema de registro automático
 */
export const DeleteIdeaDTO = {
	ParamsSchema: DeleteIdeaParamsSchema
}

// Tipos para compatibilidade com TSOA
export interface DeleteIdeaResponse {
	success: boolean
	message: string
}

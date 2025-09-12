import { z } from 'zod'

/**
 * Schema de entrada para registro de visualização
 * Segue o padrão do middleware de validação automática
 */
export const RecordViewInputSchema = z.object({
	ideas: z.array(z.string().uuid('INVALID_IDEA_ID'))
		.min(1, 'IDEAS_REQUIRED')
		.max(10, 'TOO_MANY_IDEAS')
})

/**
 * Schema de saída para registro de visualização
 */
export const RecordViewOutputSchema = z.object({
	viewed: z.boolean(),
	viewCount: z.number(),
	message: z.string()
})

/**
 * DTO padronizado para registro de visualização
 * Compatível com o sistema de registro automático
 */
export const RecordViewDTO = {
	InputSchema: RecordViewInputSchema,
	OutputSchema: RecordViewOutputSchema
}

// Tipos para compatibilidade com TSOA
export interface RecordViewInput {
	ideas: string[]
}

export interface RecordViewResponse {
	viewed: boolean
	viewCount: number
	message: string
}
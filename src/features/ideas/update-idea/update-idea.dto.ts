import { z } from 'zod'

/**
 * Schema de entrada para atualização de ideia
 * Segue o padrão do middleware de validação automática
 */
export const UpdateIdeaInputSchema = z.object({
	title: z.string()
		.min(10, 'TITLE_TOO_SHORT')
		.max(70, 'TITLE_TOO_LONG')
		.regex(/^[^{}]+$/, 'INVALID_TITLE').optional(),
	description: z.string()
		.min(50, 'DESCRIPTION_TOO_SHORT')
		.max(700, 'DESCRIPTION_TOO_LONG')
		.regex(/^[^{}]+$/, 'INVALID_DESCRIPTION').optional(),
	tags: z.array(z.string()
		.min(1, 'TAG_EMPTY')
		.max(50, 'TAG_TOO_LONG')).optional(),
	images: z.array(z.any()).optional(), // Express.Multer.File[]
	links: z.array(z.object({
		url: z.string()
			.url('INVALID_LINK_URL')
			.max(700, 'LINK_URL_TOO_LONG')
	})).optional()
})

/**
 * Schema de parâmetros para atualização de ideia
 */
export const UpdateIdeaParamsSchema = z.object({
	id: z.string().uuid('INVALID_IDEA_ID')
})

/**
 * Schema de saída para atualização de ideia
 */
export const UpdateIdeaOutputSchema = z.object({
	idea: z.object({
		id: z.string(),
		title: z.string().nullable(),
		description: z.string().nullable(),
		authorId: z.string(),
		tags: z.array(z.object({
			id: z.string(),
			name: z.string()
		})).optional(),
		images: z.array(z.object({
			id: z.string(),
			src: z.string(),
			alt: z.string(),
			width: z.number(),
			height: z.number()
		})).optional(),
		links: z.array(z.object({
			id: z.string(),
			url: z.string()
		})).optional(),
		created_at: z.string(),
		updated_at: z.string()
	})
})

/**
 * DTO padronizado para atualização de ideia
 * Compatível com o sistema de registro automático
 */
export const UpdateIdeaDTO = {
	InputSchema: UpdateIdeaInputSchema,
	ParamsSchema: UpdateIdeaParamsSchema,
	OutputSchema: UpdateIdeaOutputSchema
}

// Tipos para compatibilidade com TSOA
export interface UpdateIdeaInput {
	title?: string
	description?: string
	tags?: string[]
	images?: Express.Multer.File[]
	links?: Array<{
		url: string
	}>
}

export interface UpdateIdeaResponse {
	idea: {
		id: string
		title: string | null
		description: string | null
		authorId: string
		tags?: Array<{
			id: string
			name: string
		}>
		images?: Array<{
			id: string
			src: string
			alt: string
			width: number
			height: number
		}>
		links?: Array<{
			id: string
			url: string
		}>
		created_at: string
		updated_at: string
	}
}

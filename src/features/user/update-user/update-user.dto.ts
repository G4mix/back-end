import { z } from 'zod'

/**
 * Schema de entrada para atualização de usuário
 * Segue o padrão do middleware de validação automática
 */
export const UpdateUserInputSchema = z.object({
	displayName: z.string()
		.min(3, 'NAME_TOO_SHORT')
		.max(255, 'NAME_TOO_LONG')
		.regex(/^[^{}]+$/, 'INVALID_NAME')
		.optional(),
	autobiography: z.string()
		.min(10, 'BIO_TOO_SHORT')
		.max(500, 'BIO_TOO_LONG')
		.regex(/^[^{}]+$/, 'INVALID_BIO')
		.optional(),
	icon: z.string()
		.url('INVALID_ICON_URL')
		.max(700, 'ICON_URL_TOO_LONG')
		.optional(),
	backgroundImage: z.string()
		.url('INVALID_BACKGROUND_IMAGE_URL')
		.max(700, 'BACKGROUND_IMAGE_URL_TOO_LONG')
		.optional()
})

/**
 * DTO padronizado para atualização de usuário
 * Compatível com o sistema de registro automático
 */
export const UpdateUserDTO = {
	InputSchema: UpdateUserInputSchema
}

// Tipos para compatibilidade com TSOA
export interface UpdateUserInput {
	displayName?: string
	autobiography?: string
	icon?: string
	backgroundImage?: string
}

export interface UpdateUserOutput {
	user: {
		id: string
		username: string
		email: string
		verified: boolean
		userProfile: {
			id: string
			displayName: string
			autobiography: string | null
			icon: string | null
			backgroundImage: string | null
			links: Array<{ id: string; url: string }>
			followingCount: number
			followersCount: number
		} | null
		createdAt: Date
		updatedAt: Date
	}
}

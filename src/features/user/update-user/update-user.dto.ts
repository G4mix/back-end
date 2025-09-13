import { z } from 'zod'

/**
 * Schema de entrada para atualização de usuário
 * Segue o padrão do middleware de validação automática
 */
export const UpdateUserInputSchema = z.object({
	username: z.string()
		.min(3, 'USERNAME_TOO_SHORT')
		.max(50, 'USERNAME_TOO_LONG')
		.regex(/^[a-zA-Z0-9_]+$/, 'INVALID_USERNAME')
		.optional(),
	email: z.string()
		.email('INVALID_EMAIL')
		.max(255, 'EMAIL_TOO_LONG')
		.optional(),
	password: z.string()
		.min(8, 'PASSWORD_TOO_SHORT')
		.max(100, 'PASSWORD_TOO_LONG')
		.optional(),
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
	links: z.array(z.string()
		.url('INVALID_LINK_URL')
		.max(700, 'LINK_URL_TOO_LONG')
	).optional()
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
	username?: string
	email?: string
	password?: string
	displayName?: string
	autobiography?: string
	links?: string[]
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

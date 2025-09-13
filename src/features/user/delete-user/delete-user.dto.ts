import { z } from 'zod'

/**
 * Schema de parâmetros para exclusão de usuário
 * Segue o padrão do middleware de validação automática
 */
export const DeleteUserParamsSchema = z.object({
	id: z.string().uuid('INVALID_USER_ID')
})

/**
 * DTO padronizado para exclusão de usuário
 * Compatível com o sistema de registro automático
 */
export const DeleteUserDTO = {
	ParamsSchema: DeleteUserParamsSchema
}

// Tipos para compatibilidade com TSOA
export interface DeleteUserResponse {
	message: string
}

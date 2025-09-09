import { z } from 'zod'
import { Route, Tags, Controller, Post } from 'tsoa'
import { injectable } from 'tsyringe'
import { 
	UseInputDTO, 
	UseOutputDTO, 
	ValidateInput, 
	TransformInput 
} from '@shared/decorators'
import { CreateCommentInputDTO, CreateCommentResponseDTO } from '@shared/dto/simple.dto'

// Schema de validação Zod
const createCommentSchema = z.object({
	ideaId: z.string().uuid('ID da ideia deve ser um UUID válido'),
	content: z.string()
		.min(1, 'Conteúdo é obrigatório')
		.max(1000, 'Conteúdo deve ter no máximo 1000 caracteres'),
	parentCommentId: z.string().uuid('ID do comentário pai deve ser um UUID válido').optional()
})

// Transformador para normalizar dados
const normalizeCommentData = (data: any) => {
	return {
		...data,
		content: data.content?.trim(),
		ideaId: data.ideaId?.toLowerCase()
	}
}

@injectable()
@Route('api/v1/example')
@Tags('Example')
export class ExampleController extends Controller {
	
	/**
	 * Exemplo de uso da validação integrada com DTOs
	 * 
	 * Este exemplo mostra como:
	 * 1. Validar dados com schema Zod antes do processamento
	 * 2. Transformar dados antes da validação
	 * 3. Processar dados com DTOs inteligentes
	 * 4. Retornar resposta serializada automaticamente
	 */
	@Post('/comment')
	@UseInputDTO(CreateCommentInputDTO)
	@UseOutputDTO(CreateCommentResponseDTO)
	@ValidateInput(createCommentSchema)
	@TransformInput(normalizeCommentData)
	public async createComment(
		request: any
	): Promise<any> {
		// Os dados já foram validados e processados pelo middleware
		// request.dto.input contém o DTO processado e validado
		const inputDTO = request.getInputDTO?.() as CreateCommentInputDTO
		
		// Aqui você pode usar os dados já validados e formatados
		console.log('Dados validados:', inputDTO)
		
		// Sua lógica de negócio aqui...
		
		return {
			comment: {
				id: 'generated-id',
				...inputDTO,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			}
		}
	}
}

/**
 * Como configurar o middleware no app.ts:
 * 
 * import { SmartDTOMiddleware } from '@shared/middlewares'
 * import { Logger } from '@shared/utils/logger'
 * 
 * const logger = new Logger()
 * const smartDTOMiddleware = new SmartDTOMiddleware(logger)
 * 
 * // Use o middleware processInput() que agora inclui validação integrada
 * app.use(smartDTOMiddleware.processInput())
 * 
 * // Ou use o middleware específico para validação
 * import { dtoValidation } from '@shared/middlewares'
 * app.use('/api/v1/comment', dtoValidation(createCommentSchema))
 */

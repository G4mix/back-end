/**
 * Configuração do SmartDTOMiddleware
 * 
 * Este arquivo mostra como configurar o middleware inteligente
 * que substitui todos os serializers manuais
 */

import { Application } from 'express'
import { SmartDTOMiddleware } from '@shared/middlewares'
import { Logger } from '@shared/utils/logger'

/**
 * Configura o middleware inteligente de DTOs no Express
 * 
 * Funcionalidades:
 * - Validação automática de entrada
 * - Serialização automática de saída
 * - Injeção de dados processados nos controllers
 * - Tratamento de erros centralizado
 */
export function setupSmartDTOMiddleware(app: Application, logger: Logger) {
	const smartDTOMiddleware = new SmartDTOMiddleware(logger)

	// Middleware principal (deve ser aplicado antes das rotas)
	app.use(smartDTOMiddleware.process())

	// Middleware para processar entrada (body, query, params)
	app.use(smartDTOMiddleware.processInput())

	// Middleware para processar saída (response)
	app.use(smartDTOMiddleware.processOutput())

	// Middleware para tratamento de erros (deve ser o último)
	app.use(smartDTOMiddleware.handleErrors())

	logger.info('SmartDTOMiddleware configured successfully')
}

/**
 * Exemplo de uso em controllers:
 * 
 * @Controller()
 * export class MyController {
 *   @UseInputDTO(CreateUserInputDTO)    // Valida entrada automaticamente
 *   @UseOutputDTO(GetUserResponseDTO)   // Serializa saída automaticamente
 *   @Post('/users')
 *   public async createUser(@Request() req: any) {
 *     // Dados já validados pelo middleware
 *     const inputDTO = req.getInputDTO<CreateUserInputDTO>()
 *     
 *     const user = await this.userRepository.create(inputDTO)
 *     
 *     // Middleware serializa automaticamente
 *     return { user }
 *   }
 * }
 */

/**
 * Vantagens do middleware:
 * 
 * ✅ Elimina serializers manuais (serializeUser, serializeAuthor, etc.)
 * ✅ Validação automática de entrada com Zod
 * ✅ Serialização automática de saída com transformações
 * ✅ Controllers mais limpos e focados na lógica de negócio
 * ✅ Type safety completo com TypeScript
 * ✅ Centralização de toda lógica de DTO
 * ✅ Performance otimizada
 * ✅ Debugging facilitado com logs automáticos
 */

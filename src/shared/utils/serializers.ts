/**
 * NOTA: Este arquivo foi simplificado.
 * 
 * O tipo UserWithProfile foi movido para @shared/dto/simple.dto.ts
 * Use os DTOs inteligentes com o middleware SmartDTOMiddleware.
 * 
 * Exemplo:
 * @UseOutputDTO(GetUserByIdResponseDTO)
 * @Get('/users/:id')
 * public async getUser(@Path() id: string) {
 *   const user = await this.userRepository.findById(id)
 *   return { user } // Middleware serializa automaticamente
 * }
 */

// Re-export do tipo para compatibilidade
export type { UserWithProfile } from '@shared/dto/simple.dto'

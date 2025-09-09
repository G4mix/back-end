# Guia de Migração: Validação Integrada com DTOs

## Problema Atual

Os middlewares de `schemaValidation` atuais validam os dados brutos antes do processamento dos DTOs, causando problemas de formatação e validação inconsistente.

## Solução: Validação Integrada

A nova solução integra a validação Zod com o processamento de DTOs, garantindo que os dados sejam validados e formatados corretamente.

## Como Migrar

### 1. Antes (Problema)

```typescript
import { schemaValidation } from '@shared/middlewares/schema-validation'
import { createUserSchema } from '@shared/schemas/user.schema'

@injectable()
@Route('api/v1/auth')
export class SignupController extends Controller {
	
	@Post('/signup')
	@Middlewares<RequestHandler>(schemaValidation(createUserSchema))
	public async signup(@Body() body: any): Promise<any> {
		// Dados podem não estar formatados corretamente
		// Validação pode falhar por formatação incorreta
	}
}
```

### 2. Depois (Solução)

```typescript
import { 
	UseInputDTO, 
	UseOutputDTO, 
	ValidateInput, 
	TransformInput 
} from '@shared/decorators'
import { CreateUserInputDTO, CreateUserResponseDTO } from '@shared/dto/simple.dto'
import { z } from 'zod'

// Schema de validação Zod
const createUserSchema = z.object({
	email: z.string().email('Email inválido'),
	username: z.string().min(3, 'Username deve ter pelo menos 3 caracteres'),
	password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres')
})

// Transformador para normalizar dados
const normalizeUserData = (data: any) => ({
	...data,
	email: data.email?.toLowerCase().trim(),
	username: data.username?.trim()
})

@injectable()
@Route('api/v1/auth')
export class SignupController extends Controller {
	
	@Post('/signup')
	@UseInputDTO(CreateUserInputDTO)
	@UseOutputDTO(CreateUserResponseDTO)
	@ValidateInput(createUserSchema)
	@TransformInput(normalizeUserData)
	public async signup(
		@Body() body: any,
		@Request() request: any
	): Promise<any> {
		// Dados já validados e formatados
		const inputDTO = request.getInputDTO?.() as CreateUserInputDTO
		
		// Sua lógica de negócio aqui...
	}
}
```

## Configuração do Middleware

### 1. Atualizar app.ts

```typescript
import { SmartDTOMiddleware } from '@shared/middlewares'
import { Logger } from '@shared/utils/logger'

const logger = new Logger()
const smartDTOMiddleware = new SmartDTOMiddleware(logger)

// Use o middleware processInput() que agora inclui validação integrada
app.use(smartDTOMiddleware.processInput())
```

### 2. Ou usar middleware específico

```typescript
import { dtoValidation } from '@shared/middlewares'
import { createUserSchema } from '@shared/schemas/user.schema'

// Para rotas específicas
app.use('/api/v1/auth', dtoValidation(createUserSchema))
```

## Decorators Disponíveis

### Validação
- `@ValidateInput(schema)` - Valida dados de entrada com schema Zod
- `@ValidateOutput(schema)` - Valida dados de saída com schema Zod
- `@ValidateWithCustom(validator)` - Validação customizada

### Transformação
- `@TransformInput(transformer)` - Transforma dados antes da validação
- `@TransformOutput(transformer)` - Transforma dados após processamento

### DTOs
- `@UseInputDTO(DTOClass)` - Define DTO de entrada
- `@UseOutputDTO(DTOClass)` - Define DTO de saída

## Benefícios

1. **Validação Consistente**: Dados são validados após formatação
2. **Melhor UX**: Mensagens de erro mais claras e específicas
3. **Código Mais Limpo**: Validação declarativa com decorators
4. **Type Safety**: Validação integrada com TypeScript
5. **Flexibilidade**: Transformações customizadas antes/depois da validação

## Exemplo Completo

```typescript
import { z } from 'zod'
import { 
	UseInputDTO, 
	UseOutputDTO, 
	ValidateInput, 
	TransformInput 
} from '@shared/decorators'
import { CreateIdeaInputDTO, CreateIdeaResponseDTO } from '@shared/dto/simple.dto'

const createIdeaSchema = z.object({
	title: z.string()
		.min(1, 'Título é obrigatório')
		.max(100, 'Título deve ter no máximo 100 caracteres'),
	description: z.string()
		.min(10, 'Descrição deve ter pelo menos 10 caracteres')
		.max(2000, 'Descrição deve ter no máximo 2000 caracteres'),
	tags: z.array(z.string()).optional()
})

const normalizeIdeaData = (data: any) => ({
	...data,
	title: data.title?.trim(),
	description: data.description?.trim(),
	tags: data.tags?.map((tag: string) => tag.trim().toLowerCase()) || []
})

@injectable()
@Route('api/v1/ideas')
export class CreateIdeaController extends Controller {
	
	@Post('/')
	@UseInputDTO(CreateIdeaInputDTO)
	@UseOutputDTO(CreateIdeaResponseDTO)
	@ValidateInput(createIdeaSchema)
	@TransformInput(normalizeIdeaData)
	public async createIdea(
		@Body() body: any,
		@Request() request: any
	): Promise<any> {
		const inputDTO = request.getInputDTO?.() as CreateIdeaInputDTO
		
		// Dados já validados e formatados
		// inputDTO.title está trimado
		// inputDTO.tags está em lowercase
		// inputDTO.description tem tamanho validado
		
		// Sua lógica de negócio...
	}
}
```

## Migração Gradual

Você pode migrar gradualmente:

1. **Fase 1**: Adicionar `@ValidateInput` aos controllers existentes
2. **Fase 2**: Adicionar `@TransformInput` para normalização
3. **Fase 3**: Substituir `@Middlewares(schemaValidation)` por `@ValidateInput`
4. **Fase 4**: Remover middlewares antigos quando todos estiverem migrados

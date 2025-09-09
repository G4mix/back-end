# Sistema de DTOs Inteligentes

## Visão Geral

O sistema de DTOs inteligentes substitui os serializers manuais por uma solução baseada em classes que podem:

- **Validar automaticamente** dados de entrada usando Zod
- **Serializar automaticamente** dados de saída com transformações
- **Injetar dados processados** nos controllers via middleware
- **Aplicar transformações** de forma declarativa usando decorators

## Arquitetura

### 1. Base Class: SmartDTO

```typescript
export abstract class SmartDTO<T = any> {
  // Métodos principais
  static from<T>(data: any): T
  static fromArray<T>(dataArray: any[]): T[]
  fromRaw(data: any): this
  toJSON(): any
  isValid(): boolean
  clone(newData?: any): this
}
```

### 2. Decorators para Transformações

```typescript
// Transformações de dados
@Transform((value) => value.toUpperCase())
@MapFrom('userProfile.displayName')
@DateField()
@ArrayTransform((item) => new ItemDTO(item))

// Controle de serialização
@Serialize(true)  // ou false para excluir
@Validate(z.string().min(1))

// Decorators para controllers
@UseInputDTO(CreateUserInputDTO)
@UseOutputDTO(GetUserResponseDTO)
@AutoSerialize()
```

### 3. Middleware Inteligente

```typescript
const smartDTOMiddleware = new SmartDTOMiddleware(logger)

// Middlewares
app.use(smartDTOMiddleware.process())        // Principal
app.use(smartDTOMiddleware.processInput())   // Entrada
app.use(smartDTOMiddleware.processOutput())  // Saída
app.use(smartDTOMiddleware.handleErrors())   // Erros
```

## Exemplos de Uso

### DTO Inteligente para Usuário

```typescript
export class UserDTO extends SmartDTO {
  @MapFrom('id')
  @Serialize()
  id!: string

  @MapFrom('username')
  @Serialize()
  username!: string

  @MapFrom('created_at')
  @DateField()
  @Serialize()
  created_at!: string

  @MapFrom('userProfile')
  @Transform((profile) => new UserProfileDTO(profile).toJSON())
  @Serialize()
  userProfile!: UserProfileDTO
}
```

### Controller com Middleware

```typescript
@Controller()
export class GetUserController {
  @UseOutputDTO(GetUserResponseDTO)
  @Get('/users/:id')
  public async getUser(@Path() id: string) {
    const user = await this.userRepository.findById(id)
    
    if (!user) {
      this.setStatus(404)
      return { message: 'USER_NOT_FOUND' }
    }

    // O middleware serializa automaticamente usando GetUserResponseDTO
    return { user }
  }
}
```

### Validação de Entrada

```typescript
@Controller()
export class CreateCommentController {
  @UseInputDTO(CreateCommentInputDTO)
  @UseOutputDTO(CreateCommentResponseDTO)
  @Post('/comments')
  public async createComment(@Request() req: any) {
    // Dados já validados pelo middleware
    const inputDTO = req.getInputDTO<CreateCommentInputDTO>()
    const { ideaId, content } = inputDTO

    const comment = await this.commentRepository.create({
      ideaId,
      content,
      authorId: req.user.sub
    })

    // Middleware serializa automaticamente
    return { comment }
  }
}
```

## Vantagens

### 1. **Substitui Serializers Manuais**
```typescript
// ANTES
const user = await this.userRepository.findById(id)
return { user: serializeUser(user) }

// DEPOIS
const user = await this.userRepository.findById(id)
return { user } // Middleware serializa automaticamente
```

### 2. **Validação Centralizada**
```typescript
// ANTES
const { ideaId, content } = body
if (!ideaId || !content) {
  return 'VALIDATION_ERROR'
}

// DEPOIS
const inputDTO = req.getInputDTO<CreateCommentInputDTO>()
// Validação automática pelo middleware
```

### 3. **Transformações Declarativas**
```typescript
export class CommentDTO extends SmartDTO {
  @MapFrom('author')
  @Transform((author) => new AuthorDTO(author).toJSON())
  @Serialize()
  author!: AuthorDTO

  @MapFrom('created_at')
  @DateField()
  @Serialize()
  created_at!: string
}
```

### 4. **Type Safety Completo**
```typescript
// TypeScript infere tipos automaticamente
const inputDTO = req.getInputDTO<CreateCommentInputDTO>()
// inputDTO tem todos os tipos corretos
```

## Configuração

### 1. Instalar Dependências
```bash
npm install reflect-metadata
```

### 2. Configurar Middleware
```typescript
import { setupSmartDTOMiddleware } from '@shared/middlewares'

const app = express()
const logger = new Logger()

setupSmartDTOMiddleware(app, logger)
```

### 3. Usar em Controllers
```typescript
import { UseInputDTO, UseOutputDTO } from '@shared/decorators'

@Controller()
export class MyController {
  @UseInputDTO(MyInputDTO)
  @UseOutputDTO(MyOutputDTO)
  @Post('/endpoint')
  public async myMethod(@Request() req: any) {
    // Lógica do controller
  }
}
```

## Migração dos Serializers Existentes

### 1. Identificar Serializers
```typescript
// Encontrar funções como:
serializeUser()
serializeAuthor()
serializeComment()
```

### 2. Criar DTOs Correspondentes
```typescript
// Converter para DTOs inteligentes
export class UserDTO extends SmartDTO {
  // Mapear campos e transformações
}
```

### 3. Atualizar Controllers
```typescript
// Adicionar decorators
@UseOutputDTO(UserDTO)

// Remover chamadas de serialização manual
// return { user: serializeUser(user) }
// return { user }
```

### 4. Testar e Validar
```typescript
// Verificar se a serialização está correta
// Validar tipos TypeScript
// Testar validações de entrada
```

## Casos de Uso Avançados

### 1. DTOs Customizados
```typescript
class UserSummaryDTO extends UserDTO {
  @Serialize(false)
  email!: string

  @MapFrom('userProfile.displayName')
  @Serialize()
  displayName!: string
}
```

### 2. Validações Customizadas
```typescript
@ValidateWith((data) => {
  if (data.ideaId && !isValidUUID(data.ideaId)) {
    return 'Invalid idea ID format'
  }
  return true
})
```

### 3. Transformações de Resposta
```typescript
@TransformResponse((data) => ({
  ...data,
  timestamp: new Date().toISOString()
}))
```

## Performance

- **Validação**: Apenas quando necessário
- **Serialização**: Lazy loading de transformações
- **Caching**: DTOs podem ser clonados e reutilizados
- **Memory**: Garbage collection otimizado

## Debugging

```typescript
// Logs automáticos do middleware
logger.debug('Input processed successfully', {
  path: req.path,
  validatedFields: Object.keys(inputDTO.toJSON())
})

// Verificar propriedades serializáveis
const serializableProps = dto.getSerializableProperties()
```

## Conclusão

O sistema de DTOs inteligentes oferece:

- ✅ **Menos código** - elimina serializers manuais
- ✅ **Validação automática** - centralizada no middleware
- ✅ **Type safety** - TypeScript completo
- ✅ **Manutenibilidade** - lógica centralizada
- ✅ **Performance** - otimizada e eficiente
- ✅ **Flexibilidade** - decorators para customização
- ✅ **Debugging** - logs automáticos
- ✅ **Testabilidade** - fácil de testar

Este sistema transforma os DTOs de simples tipagens em ferramentas poderosas de serialização e validação, tornando o código mais limpo, seguro e manutenível.

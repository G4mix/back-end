# Toggle Follow Feature

## Visão Geral
Esta feature permite que usuários sigam ou parem de seguir outros usuários. O endpoint funciona como um "toggle" - se o usuário já está seguindo, ele para de seguir; se não está seguindo, ele começa a seguir.

## Rota

### POST `/v1/follow`

**Descrição:** Segue ou para de seguir um usuário específico.

**Autenticação:** Requerida (Bearer Token)

**Versão:** v1

## Parâmetros

### Body (JSON)
```json
{
  "targetUserId": "string (UUID)"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `targetUserId` | string (UUID) | Sim | ID do perfil do usuário que será seguido/parado de seguir |

## Respostas

### 204 No Content
**Descrição:** Operação realizada com sucesso (seguir ou parar de seguir)

**Exemplo:**
```http
HTTP/1.1 204 No Content
```

### 400 Bad Request
**Descrição:** Erro de validação nos dados enviados

**Possíveis erros:**
- `targetUserId` não é um UUID válido
- `targetUserId` não foi fornecido

**Exemplo:**
```json
{
  "statusCode": 400,
  "message": "O campo \"userProfileId\" deve ser uma string",
  "error": "Bad Request"
}
```

### 401 Unauthorized
**Descrição:** Token de autenticação inválido ou ausente

**Exemplo:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 404 Not Found
**Descrição:** Usuário alvo não encontrado

**Exemplo:**
```json
{
  "statusCode": 404,
  "message": "USER_NOT_FOUND"
}
```

### 400 Bad Request - Self Follow
**Descrição:** Tentativa de seguir a si mesmo

**Exemplo:**
```json
{
  "statusCode": 400,
  "message": "YOU_CANNOT_FOLLOW_YOURSELF"
}
```

## Comportamento

1. **Verificação de Autenticação:** O endpoint verifica se o usuário está autenticado
2. **Validação de Dados:** Valida se o `targetUserId` é um UUID válido
3. **Verificação de Auto-seguimento:** Impede que usuários sigam a si mesmos
4. **Verificação de Existência:** Verifica se o usuário alvo existe
5. **Toggle Logic:** 
   - Se já está seguindo → para de seguir (remove o relacionamento)
   - Se não está seguindo → começa a seguir (cria o relacionamento)

## Exemplos de Uso

### Seguir um usuário
```bash
curl -X POST http://localhost:3000/v1/follow \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUserId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

### Parar de seguir um usuário
```bash
curl -X POST http://localhost:3000/v1/follow \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUserId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

## Notas Técnicas

- O endpoint sempre retorna `204 No Content` em caso de sucesso
- Não há diferença na requisição para seguir ou parar de seguir
- O relacionamento é gerenciado automaticamente baseado no estado atual
- O `userProfileId` do usuário autenticado é extraído do token JWT
- O relacionamento é armazenado na tabela `follow` com `followerUserId` e `followingUserId`

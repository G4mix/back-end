# Funcionalidade: Toggle Follow

## Visão Geral
Permite que usuários autenticados sigam ou deixem de seguir outros usuários. O comportamento é de toggle: se o usuário já está seguindo, para de seguir; se não está seguindo, começa a seguir.

## Regras de Negócio
- Usuário deve estar autenticado
- Usuário alvo deve existir
- Usuário não pode seguir a si mesmo
- Comportamento de toggle: adiciona follow se não existe, remove se já existe
- Atualiza contadores de seguidores/seguindo automaticamente
- Suporta relacionamento bidirecional de follow

## Cenários

### Cenário: Seguir um usuário pela primeira vez
```gherkin
Dado que estou autenticado como usuário
E existe um usuário com id "user-123"
E eu ainda não sigo este usuário
Quando envio uma requisição POST para "/v1/follow/toggle" com:
  | Campo | Valor |
  | targetUserId | "user-123" |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | following | boolean |
  | message | string |
E following deve ser true
E message deve ser "User followed successfully"
```

### Cenário: Deixar de seguir um usuário já seguido
```gherkin
Dado que estou autenticado como usuário
E existe um usuário com id "user-123"
E eu já sigo este usuário
Quando envio uma requisição POST para "/v1/follow/toggle" com:
  | Campo | Valor |
  | targetUserId | "user-123" |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | following | boolean |
  | message | string |
E following deve ser false
E message deve ser "User unfollowed successfully"
```

### Cenário: Toggle follow sem autenticação
```gherkin
Dado que não estou autenticado
Quando envio uma requisição POST para "/v1/follow/toggle" com:
  | Campo | Valor |
  | targetUserId | "user-123" |
Então devo receber uma resposta 401 com erro "UNAUTHORIZED"
```

### Cenário: Toggle follow em usuário inexistente
```gherkin
Dado que estou autenticado como usuário
E não existe um usuário com id "user-inexistente"
Quando envio uma requisição POST para "/v1/follow/toggle" com:
  | Campo | Valor |
  | targetUserId | "user-inexistente" |
Então devo receber uma resposta 404 com erro "USER_NOT_FOUND"
```

### Cenário: Tentar seguir a si mesmo
```gherkin
Dado que estou autenticado como usuário com id "user-123"
Quando envio uma requisição POST para "/v1/follow/toggle" com:
  | Campo | Valor |
  | targetUserId | "user-123" |
Então devo receber uma resposta 400 com erro "CANNOT_FOLLOW_SELF"
```

### Cenário: Toggle follow sem targetUserId
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição POST para "/v1/follow/toggle" com:
  | Campo | Valor |
  | targetUserId | "" |
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Erro interno do servidor
```gherkin
Dado que estou autenticado como usuário
E existe um usuário com id "user-123"
E o banco de dados está indisponível
Quando envio uma requisição POST para "/v1/follow/toggle" com:
  | Campo | Valor |
  | targetUserId | "user-123" |
Então devo receber uma resposta 500 com erro "DATABASE_ERROR"
```

## Formato de Resposta

### Sucesso ao Seguir (200)
```json
{
  "following": true,
  "message": "User followed successfully"
}
```

### Sucesso ao Deixar de Seguir (200)
```json
{
  "following": false,
  "message": "User unfollowed successfully"
}
```

### Respostas de Erro
- **400**: `CANNOT_FOLLOW_SELF`, erros de validação (targetUserId obrigatório)
- **401**: `UNAUTHORIZED` (usuário não autenticado)
- **404**: `USER_NOT_FOUND` (usuário alvo não encontrado)
- **500**: `DATABASE_ERROR` (erro interno do servidor)

## Estrutura de Dados

### Campos de Entrada
- **targetUserId** (obrigatório): ID do usuário a ser seguido/deixado de seguir

### Campos de Resposta
- **following**: Status atual do follow (true = seguindo, false = não seguindo)
- **message**: Mensagem descritiva da ação realizada

## Comportamento do Toggle

### Primeira Interação (Seguir)
- Verifica se usuário já segue o alvo
- Se não segue, cria um novo relacionamento de follow
- Atualiza contadores de seguidores/seguindo
- Retorna `following: true`

### Segunda Interação (Deixar de Seguir)
- Verifica se usuário já segue o alvo
- Se já segue, remove o relacionamento de follow
- Atualiza contadores de seguidores/seguindo
- Retorna `following: false`

### Terceira Interação (Seguir Novamente)
- Ciclo se repete, criando o relacionamento novamente
- Comportamento consistente independente do número de interações

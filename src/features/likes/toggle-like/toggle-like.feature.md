# Funcionalidade: Toggle Like

## Visão Geral
Permite que usuários autenticados curtam ou descurtam ideias e comentários. O comportamento é de toggle: se o usuário já curtiu, remove o like; se não curtiu, adiciona o like.

## Regras de Negócio
- Usuário deve estar autenticado
- Ideia deve existir (obrigatório)
- Comentário deve existir (se fornecido)
- Comportamento de toggle: adiciona like se não existe, remove se já existe
- Atualiza contador de likes automaticamente
- Suporta likes em ideias e comentários

## Cenários

### Cenário: Curtir uma ideia pela primeira vez
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com id "idea-123"
E eu ainda não curti esta ideia
Quando envio uma requisição POST para "/v1/likes/toggle" com:
  | Campo | Valor |
  | ideaId | "idea-123" |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | liked | boolean |
  | likeCount | number |
  | message | string |
E liked deve ser true
E likeCount deve ser incrementado
E message deve ser "Like added successfully"
```

### Cenário: Descurtir uma ideia já curtida
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com id "idea-123"
E eu já curti esta ideia
Quando envio uma requisição POST para "/v1/likes/toggle" com:
  | Campo | Valor |
  | ideaId | "idea-123" |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | liked | boolean |
  | likeCount | number |
  | message | string |
E liked deve ser false
E likeCount deve ser decrementado
E message deve ser "Like removed successfully"
```

### Cenário: Curtir um comentário pela primeira vez
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com id "idea-123"
E existe um comentário com id "comment-456" na ideia
E eu ainda não curti este comentário
Quando envio uma requisição POST para "/v1/likes/toggle" com:
  | Campo | Valor |
  | ideaId | "idea-123" |
  | commentId | "comment-456" |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | liked | boolean |
  | likeCount | number |
  | message | string |
E liked deve ser true
E likeCount deve ser incrementado
E message deve ser "Like added successfully"
```

### Cenário: Descurtir um comentário já curtido
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com id "idea-123"
E existe um comentário com id "comment-456" na ideia
E eu já curti este comentário
Quando envio uma requisição POST para "/v1/likes/toggle" com:
  | Campo | Valor |
  | ideaId | "idea-123" |
  | commentId | "comment-456" |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | liked | boolean |
  | likeCount | number |
  | message | string |
E liked deve ser false
E likeCount deve ser decrementado
E message deve ser "Like removed successfully"
```

### Cenário: Toggle like sem autenticação
```gherkin
Dado que não estou autenticado
Quando envio uma requisição POST para "/v1/likes/toggle" com:
  | Campo | Valor |
  | ideaId | "idea-123" |
Então devo receber uma resposta 401 com erro "UNAUTHORIZED"
```

### Cenário: Toggle like em ideia inexistente
```gherkin
Dado que estou autenticado como usuário
E não existe uma ideia com id "idea-inexistente"
Quando envio uma requisição POST para "/v1/likes/toggle" com:
  | Campo | Valor |
  | ideaId | "idea-inexistente" |
Então devo receber uma resposta 404 com erro "IDEA_NOT_FOUND"
```

### Cenário: Toggle like em comentário inexistente
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com id "idea-123"
E não existe um comentário com id "comment-inexistente"
Quando envio uma requisição POST para "/v1/likes/toggle" com:
  | Campo | Valor |
  | ideaId | "idea-123" |
  | commentId | "comment-inexistente" |
Então devo receber uma resposta 404 com erro "COMMENT_NOT_FOUND"
```

### Cenário: Toggle like sem ideaId
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição POST para "/v1/likes/toggle" com:
  | Campo | Valor |
  | commentId | "comment-456" |
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Toggle like com ideaId vazio
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição POST para "/v1/likes/toggle" com:
  | Campo | Valor |
  | ideaId | "" |
  | commentId | "comment-456" |
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Erro interno do servidor
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com id "idea-123"
E o banco de dados está indisponível
Quando envio uma requisição POST para "/v1/likes/toggle" com:
  | Campo | Valor |
  | ideaId | "idea-123" |
Então devo receber uma resposta 500 com erro "DATABASE_ERROR"
```

## Formato de Resposta

### Sucesso ao Adicionar Like (200)
```json
{
  "liked": true,
  "likeCount": 15,
  "message": "Like added successfully"
}
```

### Sucesso ao Remover Like (200)
```json
{
  "liked": false,
  "likeCount": 14,
  "message": "Like removed successfully"
}
```

### Respostas de Erro
- **400**: Erros de validação (ideaId obrigatório, campos inválidos)
- **401**: `UNAUTHORIZED` (usuário não autenticado)
- **404**: `IDEA_NOT_FOUND`, `COMMENT_NOT_FOUND`
- **500**: `DATABASE_ERROR` (erro interno do servidor)

## Estrutura de Dados

### Campos de Entrada
- **ideaId** (obrigatório): ID da ideia
- **commentId** (opcional): ID do comentário (para curtir comentários)

### Campos de Resposta
- **liked**: Status atual do like (true = curtido, false = não curtido)
- **likeCount**: Número total de likes no conteúdo
- **message**: Mensagem descritiva da ação realizada

## Comportamento do Toggle

### Primeira Interação (Adicionar Like)
- Verifica se usuário já curtiu o conteúdo
- Se não curtiu, cria um novo like
- Incrementa contador de likes
- Retorna `liked: true`

### Segunda Interação (Remover Like)
- Verifica se usuário já curtiu o conteúdo
- Se já curtiu, remove o like existente
- Decrementa contador de likes
- Retorna `liked: false`

### Terceira Interação (Adicionar Like Novamente)
- Ciclo se repete, adicionando o like novamente
- Comportamento consistente independente do número de interações

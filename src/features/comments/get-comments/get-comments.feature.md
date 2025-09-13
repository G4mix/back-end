# Funcionalidade: Buscar Comentários

## Visão Geral
Permite que usuários autenticados busquem comentários de uma ideia específica com paginação e filtros, incluindo respostas hierárquicas e métricas de engajamento.

## Regras de Negócio
- Usuário deve estar autenticado
- Ideia deve existir no sistema
- Suporta paginação com limite configurável
- Filtro por comentário pai para respostas
- Inclui informações do autor e métricas de engajamento
- Ordenação por data de criação (mais recentes primeiro)
- Limite máximo de 100 comentários por página

## Cenários

### Cenário: Buscar comentários de uma ideia com sucesso
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com ID "idea-123" no sistema
E a ideia possui comentários
Quando envio uma requisição GET para "/v1/comments?ideaId=idea-123"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | comments | array |
  | pagination | object |
E cada comentário deve conter id, content, ideaId, parentCommentId, authorId, author, created_at, updated_at, _count
E author deve conter id, displayName, icon
E _count deve conter likes, replies
```

### Cenário: Buscar comentários com paginação
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com ID "idea-123" no sistema
E a ideia possui mais de 10 comentários
Quando envio uma requisição GET para "/v1/comments?ideaId=idea-123&page=1&limit=5"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | comments | array |
  | pagination | object |
E pagination.page deve ser 1
E pagination.limit deve ser 5
E comments deve conter no máximo 5 itens
```

### Cenário: Buscar respostas de um comentário específico
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com ID "idea-123" no sistema
E existe um comentário com ID "comment-456" que possui respostas
Quando envio uma requisição GET para "/v1/comments?ideaId=idea-123&parentCommentId=comment-456"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | comments | array |
  | pagination | object |
E todos os comentários devem ter parentCommentId igual a "comment-456"
```

### Cenário: Buscar comentários de ideia sem comentários
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com ID "idea-123" no sistema
E a ideia não possui comentários
Quando envio uma requisição GET para "/v1/comments?ideaId=idea-123"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | comments | array |
  | pagination | object |
E comments deve ser um array vazio
E pagination.total deve ser 0
```

### Cenário: Buscar comentários sem autenticação
```gherkin
Dado que não estou autenticado
Quando envio uma requisição GET para "/v1/comments?ideaId=idea-123"
Então devo receber uma resposta 401 com erro "UNAUTHORIZED"
```

### Cenário: Buscar comentários sem ideaId
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/comments"
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Buscar comentários com parâmetros inválidos
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/comments?ideaId=idea-123&page=-1&limit=200"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | comments | array |
  | pagination | object |
E pagination.page deve ser 0 (valor padrão)
E pagination.limit deve ser limitado a 100 (máximo)
```

### Cenário: Buscar comentários de ideia inexistente
```gherkin
Dado que estou autenticado como usuário
E não existe uma ideia com ID "idea-inexistente" no sistema
Quando envio uma requisição GET para "/v1/comments?ideaId=idea-inexistente"
Então devo receber uma resposta 404 com erro "IDEA_NOT_FOUND"
```

### Cenário: Erro interno do servidor
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com ID "idea-123" no sistema
E o banco de dados está indisponível
Quando envio uma requisição GET para "/v1/comments?ideaId=idea-123"
Então devo receber uma resposta 500 com erro "DATABASE_ERROR"
```

## Formato de Resposta

### Resposta de Sucesso (200)
```json
{
  "comments": [
    {
      "id": "comment-uuid-123",
      "content": "Este é um comentário interessante sobre a ideia!",
      "ideaId": "idea-uuid-123",
      "parentCommentId": null,
      "authorId": "user-profile-uuid",
      "author": {
        "id": "user-profile-uuid",
        "displayName": "João Silva",
        "icon": "https://example.com/avatar.jpg"
      },
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z",
      "_count": {
        "likes": 5,
        "replies": 2
      }
    }
  ],
  "pagination": {
    "page": 0,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Respostas de Erro
- **400**: Erros de validação (ideaId obrigatório, parâmetros inválidos)
- **401**: `UNAUTHORIZED` (usuário não autenticado)
- **404**: `IDEA_NOT_FOUND` (ideia não encontrada)
- **500**: `DATABASE_ERROR` (erro interno do servidor)

## Parâmetros de Query

### Parâmetros Obrigatórios
- **ideaId**: ID da ideia para buscar comentários

### Parâmetros Opcionais
- **parentCommentId**: ID do comentário pai (para buscar respostas)
- **page**: Número da página (padrão: 0)
- **limit**: Número de comentários por página (padrão: 10, máximo: 100)

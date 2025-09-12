# Funcionalidade: Criar Comentário

## Visão Geral
Permite que usuários autenticados criem comentários em ideias ou respondam a comentários existentes, suportando estrutura hierárquica de comentários com replies.

## Regras de Negócio
- Usuário deve estar autenticado
- Ideia de destino deve existir
- Comentário pai deve existir (se for uma resposta)
- Conteúdo do comentário é obrigatório
- Comentários suportam estrutura hierárquica (replies)
- Cada comentário tem métricas de engajamento (likes, replies)

## Cenários

### Cenário: Criar comentário principal em uma ideia
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com id "idea-123"
Quando envio uma requisição POST para "/v1/comment/" com:
  | Campo | Valor |
  | ideaId | "idea-123" |
  | content | "Esta é uma ideia incrível! Gostaria de contribuir." |
Então devo receber uma resposta 201 com:
  | Campo | Tipo |
  | comment | object |
E o comentário deve conter id, content, ideaId, authorId, author e timestamps
E o parentCommentId deve ser null
```

### Cenário: Criar resposta a um comentário existente
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com id "idea-123"
E existe um comentário com id "comment-456" na ideia
Quando envio uma requisição POST para "/v1/comment/" com:
  | Campo | Valor |
  | ideaId | "idea-123" |
  | content | "Obrigado pelo feedback!" |
  | parentCommentId | "comment-456" |
Então devo receber uma resposta 201 com:
  | Campo | Tipo |
  | comment | object |
E o comentário deve conter parentCommentId igual a "comment-456"
E o authorId deve ser o meu userProfileId
```

### Cenário: Criar comentário sem autenticação
```gherkin
Dado que não estou autenticado
Quando envio uma requisição POST para "/v1/comment/" com:
  | Campo | Valor |
  | ideaId | "idea-123" |
  | content | "Comentário sem auth" |
Então devo receber uma resposta 401 com erro "UNAUTHORIZED"
```

### Cenário: Criar comentário em ideia inexistente
```gherkin
Dado que estou autenticado como usuário
E não existe uma ideia com id "idea-inexistente"
Quando envio uma requisição POST para "/v1/comment/" com:
  | Campo | Valor |
  | ideaId | "idea-inexistente" |
  | content | "Comentário em ideia inexistente" |
Então devo receber uma resposta 404 com erro "IDEA_NOT_FOUND"
```

### Cenário: Responder a comentário inexistente
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com id "idea-123"
E não existe um comentário com id "comment-inexistente"
Quando envio uma requisição POST para "/v1/comment/" com:
  | Campo | Valor |
  | ideaId | "idea-123" |
  | content | "Resposta a comentário inexistente" |
  | parentCommentId | "comment-inexistente" |
Então devo receber uma resposta 404 com erro "PARENT_COMMENT_NOT_FOUND"
```

### Cenário: Criar comentário com conteúdo vazio
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com id "idea-123"
Quando envio uma requisição POST para "/v1/comment/" com:
  | Campo | Valor |
  | ideaId | "idea-123" |
  | content | "" |
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Criar comentário sem ideaId
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição POST para "/v1/comment/" com:
  | Campo | Valor |
  | content | "Comentário sem ideia" |
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Criar comentário com conteúdo muito longo
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com id "idea-123"
E tenho um conteúdo com mais de 1000 caracteres
Quando envio uma requisição POST para "/v1/comment/" com:
  | Campo | Valor |
  | ideaId | "idea-123" |
  | content | "conteúdo muito longo..." |
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Erro interno do servidor
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com id "idea-123"
E o banco de dados está indisponível
Quando envio uma requisição POST para "/v1/comment/" com:
  | Campo | Valor |
  | ideaId | "idea-123" |
  | content | "Comentário de teste" |
Então devo receber uma resposta 500 com erro "Failed to create comment"
```

## Formato de Resposta

### Sucesso na Criação de Comentário (201)
```json
{
  "comment": {
    "id": "comment-uuid-789",
    "content": "Esta é uma ideia incrível! Gostaria de contribuir.",
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
      "likes": 0,
      "replies": 0
    }
  }
}
```

### Sucesso na Criação de Resposta (201)
```json
{
  "comment": {
    "id": "comment-uuid-790",
    "content": "Obrigado pelo feedback!",
    "ideaId": "idea-uuid-123",
    "parentCommentId": "comment-uuid-456",
    "authorId": "user-profile-uuid",
    "author": {
      "id": "user-profile-uuid",
      "displayName": "Maria Santos",
      "icon": "https://example.com/avatar2.jpg"
    },
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z",
    "_count": {
      "likes": 0,
      "replies": 0
    }
  }
}
```

### Respostas de Erro
- **400**: Erros de validação (campos obrigatórios, formato inválido)
- **401**: `UNAUTHORIZED` (usuário não autenticado)
- **404**: `IDEA_NOT_FOUND`, `PARENT_COMMENT_NOT_FOUND`
- **500**: `Failed to create comment` (erro interno do servidor)

## Estrutura de Dados

### Campos de Entrada
- **ideaId** (obrigatório): ID da ideia onde o comentário será criado
- **content** (obrigatório): Conteúdo do comentário
- **parentCommentId** (opcional): ID do comentário pai (para replies)

### Campos de Resposta
- **id**: ID único do comentário criado
- **content**: Conteúdo do comentário
- **ideaId**: ID da ideia
- **parentCommentId**: ID do comentário pai (null para comentários principais)
- **authorId**: ID do perfil do autor
- **author**: Informações do autor (id, displayName, icon)
- **created_at**: Data de criação
- **updated_at**: Data da última atualização
- **_count**: Métricas de engajamento (likes, replies)

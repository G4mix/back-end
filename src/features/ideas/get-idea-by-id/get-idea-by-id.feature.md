# Funcionalidade: Buscar Ideia por ID

## Visão Geral
Permite buscar uma ideia específica pelo seu ID único, retornando todos os detalhes da ideia incluindo informações do autor e métricas de engajamento.

## Regras de Negócio
- Usuário deve estar autenticado
- Ideia deve existir no sistema
- Retorna dados completos da ideia
- Inclui informações do autor e métricas de engajamento
- Suporta visualização de ideias de qualquer usuário

## Cenários

### Cenário: Buscar ideia existente com sucesso
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com ID "idea-123" no sistema
Quando envio uma requisição GET para "/v1/idea/idea-123"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | idea | object |
E a ideia deve conter id, title, description, authorId, author, created_at, updated_at, _count
E author deve conter id, displayName, icon
E _count deve conter likes, views, comments
```

### Cenário: Buscar ideia inexistente
```gherkin
Dado que estou autenticado como usuário
E não existe uma ideia com ID "idea-inexistente" no sistema
Quando envio uma requisição GET para "/v1/idea/idea-inexistente"
Então devo receber uma resposta 404 com erro "IDEA_NOT_FOUND"
```

### Cenário: Buscar ideia sem autenticação
```gherkin
Dado que não estou autenticado
Quando envio uma requisição GET para "/v1/idea/idea-123"
Então devo receber uma resposta 401 com erro "UNAUTHORIZED"
```

### Cenário: Buscar ideia com ID inválido
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/idea/id-invalido"
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Erro interno do servidor
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com ID "idea-123" no sistema
E o banco de dados está indisponível
Quando envio uma requisição GET para "/v1/idea/idea-123"
Então devo receber uma resposta 500 com erro "DATABASE_ERROR"
```

## Formato de Resposta

### Resposta de Sucesso (200)
```json
{
  "idea": {
    "id": "idea-uuid-123",
    "title": "Título da Ideia",
    "description": "Descrição detalhada da ideia...",
    "summary": "Resumo da ideia",
    "tags": "tag1,tag2,tag3",
    "authorId": "user-profile-uuid",
    "author": {
      "id": "user-profile-uuid",
      "displayName": "João Silva",
      "icon": "https://example.com/avatar.jpg"
    },
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z",
    "_count": {
      "likes": 15,
      "views": 120,
      "comments": 8
    }
  }
}
```

### Respostas de Erro
- **400**: Erros de validação (ID inválido)
- **401**: `UNAUTHORIZED` (usuário não autenticado)
- **404**: `IDEA_NOT_FOUND` (ideia não encontrada)
- **500**: `DATABASE_ERROR` (erro interno do servidor)

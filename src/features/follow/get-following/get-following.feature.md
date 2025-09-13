# Funcionalidade: Buscar Seguindo

## Visão Geral
Permite que usuários autenticados busquem uma lista paginada de usuários que um perfil específico está seguindo, incluindo informações detalhadas dos usuários seguidos e métricas de relacionamento.

## Regras de Negócio
- Usuário deve estar autenticado
- ID do usuário deve ser um UUID válido
- Suporta paginação com limite configurável
- Retorna informações completas dos usuários seguidos
- Ordenação por data de criação (mais recentes primeiro)
- Limite máximo de 100 usuários por página
- Usuários podem visualizar quem qualquer perfil está seguindo

## Cenários

### Cenário: Buscar seguindo com paginação padrão
```gherkin
Dado que estou autenticado como usuário
E existe um usuário com ID "user-uuid-123"
Quando envio uma requisição GET para "/v1/follow/following?userId=user-uuid-123"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | following | array |
  | pagination | object |
E pagination deve conter page, limit, total, totalPages, hasNext, hasPrev
E cada following deve conter id, followingUser, created_at
E followingUser deve conter id, displayName, icon, username
```

### Cenário: Buscar seguindo com paginação customizada
```gherkin
Dado que estou autenticado como usuário
E existe um usuário com ID "user-uuid-123"
Quando envio uma requisição GET para "/v1/follow/following?userId=user-uuid-123&page=1&limit=5"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | following | array |
  | pagination | object |
E pagination.page deve ser 1
E pagination.limit deve ser 5
E following deve conter no máximo 5 itens
```

### Cenário: Buscar seguindo de usuário que não segue ninguém
```gherkin
Dado que estou autenticado como usuário
E existe um usuário com ID "user-uuid-123"
E o usuário não está seguindo ninguém
Quando envio uma requisição GET para "/v1/follow/following?userId=user-uuid-123"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | following | array |
  | pagination | object |
E following deve ser um array vazio
E pagination.total deve ser 0
```

### Cenário: Buscar seguindo sem autenticação
```gherkin
Dado que não estou autenticado
Quando envio uma requisição GET para "/v1/follow/following?userId=user-uuid-123"
Então devo receber uma resposta 401 com erro "UNAUTHORIZED"
```

### Cenário: Buscar seguindo sem userId
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/follow/following"
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Buscar seguindo com userId inválido
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/follow/following?userId=id-invalido"
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Buscar seguindo de usuário inexistente
```gherkin
Dado que estou autenticado como usuário
E não existe um usuário com ID "user-inexistente"
Quando envio uma requisição GET para "/v1/follow/following?userId=user-inexistente"
Então devo receber uma resposta 404 com erro "USER_NOT_FOUND"
```

### Cenário: Buscar seguindo com limite inválido
```gherkin
Dado que estou autenticado como usuário
E existe um usuário com ID "user-uuid-123"
Quando envio uma requisição GET para "/v1/follow/following?userId=user-uuid-123&limit=200"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | following | array |
  | pagination | object |
E pagination.limit deve ser limitado a 100 (máximo)
```

### Cenário: Erro interno do servidor
```gherkin
Dado que estou autenticado como usuário
E existe um usuário com ID "user-uuid-123"
E o banco de dados está indisponível
Quando envio uma requisição GET para "/v1/follow/following?userId=user-uuid-123"
Então devo receber uma resposta 500 com erro "DATABASE_ERROR"
```

## Formato de Resposta

### Resposta de Sucesso (200)
```json
{
  "following": [
    {
      "id": "follow-uuid-123",
      "followingUser": {
        "id": "user-profile-uuid",
        "displayName": "Maria Santos",
        "icon": "https://example.com/icon.jpg",
        "username": "maria_santos"
      },
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 0,
    "limit": 10,
    "total": 15,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Respostas de Erro
- **400**: Erros de validação (userId obrigatório, formato inválido)
- **401**: `UNAUTHORIZED` (usuário não autenticado)
- **404**: `USER_NOT_FOUND` (usuário não encontrado)
- **500**: `DATABASE_ERROR` (erro interno do servidor)

## Parâmetros de Query

### Parâmetros Obrigatórios
- **userId**: ID do usuário para buscar quem está seguindo

### Parâmetros Opcionais
- **page**: Número da página (padrão: 0)
- **limit**: Número de usuários por página (padrão: 10, máximo: 100)

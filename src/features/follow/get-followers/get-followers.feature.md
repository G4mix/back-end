# Funcionalidade: Buscar Seguidores

## Visão Geral
Permite que usuários autenticados busquem uma lista paginada de seguidores de um perfil de usuário específico, incluindo informações detalhadas dos seguidores e métricas de relacionamento.

## Regras de Negócio
- Usuário deve estar autenticado
- ID do usuário deve ser um UUID válido
- Suporta paginação com limite configurável
- Retorna informações completas dos seguidores
- Ordenação por data de criação (mais recentes primeiro)
- Limite máximo de 100 seguidores por página
- Usuários podem visualizar seguidores de qualquer perfil

## Cenários

### Cenário: Buscar seguidores com paginação padrão
```gherkin
Dado que estou autenticado como usuário
E existe um usuário com ID "user-uuid-123"
Quando envio uma requisição GET para "/v1/follow/followers?userId=user-uuid-123"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | followers | array |
  | pagination | object |
E pagination deve conter page, limit, total, totalPages, hasNext, hasPrev
E cada follower deve conter id, followerUser, created_at
E followerUser deve conter id, displayName, icon, username
```

### Cenário: Buscar seguidores com paginação customizada
```gherkin
Dado que estou autenticado como usuário
E existe um usuário com ID "user-uuid-123"
Quando envio uma requisição GET para "/v1/follow/followers?userId=user-uuid-123&page=1&limit=5"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | followers | array |
  | pagination | object |
E pagination.page deve ser 1
E pagination.limit deve ser 5
E followers deve conter no máximo 5 itens
```

### Cenário: Buscar seguidores de usuário sem seguidores
```gherkin
Dado que estou autenticado como usuário
E existe um usuário com ID "user-uuid-123"
E o usuário não possui seguidores
Quando envio uma requisição GET para "/v1/follow/followers?userId=user-uuid-123"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | followers | array |
  | pagination | object |
E followers deve ser um array vazio
E pagination.total deve ser 0
```

### Cenário: Buscar seguidores sem autenticação
```gherkin
Dado que não estou autenticado
Quando envio uma requisição GET para "/v1/follow/followers?userId=user-uuid-123"
Então devo receber uma resposta 401 com erro "UNAUTHORIZED"
```

### Cenário: Buscar seguidores sem userId
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/follow/followers"
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Buscar seguidores com userId inválido
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/follow/followers?userId=id-invalido"
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Buscar seguidores de usuário inexistente
```gherkin
Dado que estou autenticado como usuário
E não existe um usuário com ID "user-inexistente"
Quando envio uma requisição GET para "/v1/follow/followers?userId=user-inexistente"
Então devo receber uma resposta 404 com erro "USER_NOT_FOUND"
```

### Cenário: Buscar seguidores com limite inválido
```gherkin
Dado que estou autenticado como usuário
E existe um usuário com ID "user-uuid-123"
Quando envio uma requisição GET para "/v1/follow/followers?userId=user-uuid-123&limit=200"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | followers | array |
  | pagination | object |
E pagination.limit deve ser limitado a 100 (máximo)
```

### Cenário: Erro interno do servidor
```gherkin
Dado que estou autenticado como usuário
E existe um usuário com ID "user-uuid-123"
E o banco de dados está indisponível
Quando envio uma requisição GET para "/v1/follow/followers?userId=user-uuid-123"
Então devo receber uma resposta 500 com erro "DATABASE_ERROR"
```

## Formato de Resposta

### Resposta de Sucesso (200)
```json
{
  "followers": [
    {
      "id": "follow-uuid-123",
      "followerUser": {
        "id": "user-profile-uuid",
        "displayName": "João Silva",
        "icon": "https://example.com/icon.jpg",
        "username": "joao_silva"
      },
      "created_at": "2024-01-01T00:00:00.000Z"
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
- **400**: Erros de validação (userId obrigatório, formato inválido)
- **401**: `UNAUTHORIZED` (usuário não autenticado)
- **404**: `USER_NOT_FOUND` (usuário não encontrado)
- **500**: `DATABASE_ERROR` (erro interno do servidor)

## Parâmetros de Query

### Parâmetros Obrigatórios
- **userId**: ID do usuário para buscar seguidores

### Parâmetros Opcionais
- **page**: Número da página (padrão: 0)
- **limit**: Número de seguidores por página (padrão: 10, máximo: 100)

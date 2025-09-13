# Funcionalidade: Buscar Usuários

## Visão Geral
Permite que usuários autenticados busquem e visualizem uma lista paginada de usuários com funcionalidade de busca opcional por nome de usuário ou nome de exibição.

## Regras de Negócio
- Usuário deve estar autenticado
- Suporta paginação com limite configurável
- Busca case-insensitive por username e displayName
- Retorna apenas usuários verificados
- Ordenação por data de criação (mais recentes primeiro)
- Limite máximo de 100 usuários por página

## Cenários

### Cenário: Buscar usuários com paginação padrão
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/user"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | users | array |
  | pagination | object |
E pagination deve conter page, limit, total
E page deve ser 0 (padrão)
E limit deve ser 10 (padrão)
```

### Cenário: Buscar usuários com paginação customizada
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/user?page=1&limit=5"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | users | array |
  | pagination | object |
E pagination.page deve ser 1
E pagination.limit deve ser 5
E users deve conter no máximo 5 itens
```

### Cenário: Buscar usuários por texto
```gherkin
Dado que estou autenticado como usuário
E existem usuários com usernames "joao_silva" e "maria_santos"
Quando envio uma requisição GET para "/v1/user?search=joao"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | users | array |
  | pagination | object |
E todos os usuários devem conter "joao" no username ou displayName
E a busca deve ser case-insensitive
```

### Cenário: Buscar usuários com resultado vazio
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/user?search=inexistente"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | users | array |
  | pagination | object |
E users deve ser um array vazio
E pagination.total deve ser 0
```

### Cenário: Buscar usuários sem autenticação
```gherkin
Dado que não estou autenticado
Quando envio uma requisição GET para "/v1/user"
Então devo receber uma resposta 401 com erro "UNAUTHORIZED"
```

### Cenário: Buscar usuários com limite inválido
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/user?limit=200"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | users | array |
  | pagination | object |
E pagination.limit deve ser limitado a 100 (máximo)
```

### Cenário: Buscar usuários com página negativa
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/user?page=-1"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | users | array |
  | pagination | object |
E pagination.page deve ser 0 (valor padrão)
```

### Cenário: Erro interno do servidor
```gherkin
Dado que estou autenticado como usuário
E o banco de dados está indisponível
Quando envio uma requisição GET para "/v1/user"
Então devo receber uma resposta 500 com erro "DATABASE_ERROR"
```

## Formato de Resposta

### Resposta de Sucesso (200)
```json
{
  "users": [
    {
      "id": "user-uuid-123",
      "username": "joao_silva",
      "email": "joao@example.com",
      "verified": true,
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z",
      "userProfile": {
        "id": "profile-uuid-123",
        "icon": "https://example.com/avatar.jpg",
        "displayName": "João Silva",
        "autobiography": "Desenvolvedor Full Stack",
        "backgroundImage": "https://example.com/bg.jpg",
        "isFollowing": false,
        "links": ["https://github.com/joao", "https://linkedin.com/in/joao"],
        "followersCount": 25,
        "followingCount": 15
      }
    }
  ],
  "pagination": {
    "page": 0,
    "limit": 10,
    "total": 150
  }
}
```

### Respostas de Erro
- **401**: `UNAUTHORIZED` (usuário não autenticado)
- **500**: `DATABASE_ERROR` (erro interno do servidor)

## Parâmetros de Query

### Parâmetros de Paginação
- **page** (opcional): Número da página (padrão: 0)
- **limit** (opcional): Número de usuários por página (padrão: 10, máximo: 100)

### Parâmetros de Busca
- **search** (opcional): Termo de busca para username ou displayName (case-insensitive)

# Funcionalidade: Buscar Ideias

## Visão Geral
Permite que usuários autenticados busquem e filtrem ideias com recursos de paginação, busca por texto, filtros por autor e tags, e ordenação por diferentes critérios.

## Regras de Negócio
- Usuário deve estar autenticado
- Suporta paginação com limite configurável
- Busca por texto no título e descrição
- Filtro por autor específico
- Filtro por tags (múltiplas tags suportadas)
- Ordenação por data de criação, atualização ou título
- Ordem crescente ou decrescente
- Inclui métricas de engajamento (likes, views, comments)
- Retorna informações do autor e mídia associada

## Cenários

### Cenário: Buscar todas as ideias (página inicial)
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/idea/"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | ideas | array |
  | pagination | object |
E pagination deve conter page, limit, total, totalPages, hasNext, hasPrev
E cada ideia deve conter id, title, description, authorId, author, created_at, updated_at, _count
```

### Cenário: Buscar ideias com paginação
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/idea/?page=1&limit=5"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | ideas | array |
  | pagination | object |
E pagination.page deve ser 1
E pagination.limit deve ser 5
E ideas deve conter no máximo 5 itens
```

### Cenário: Buscar ideias por texto
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/idea/?search=mobile app"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | ideas | array |
  | pagination | object |
E todas as ideias devem conter "mobile app" no título ou descrição
```

### Cenário: Buscar ideias por autor
```gherkin
Dado que estou autenticado como usuário
E existe um autor com id "author-123"
Quando envio uma requisição GET para "/v1/idea/?authorId=author-123"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | ideas | array |
  | pagination | object |
E todas as ideias devem ter authorId igual a "author-123"
```

### Cenário: Buscar ideias por tags
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/idea/?tags=innovation,technology"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | ideas | array |
  | pagination | object |
E todas as ideias devem conter as tags "innovation" ou "technology"
```

### Cenário: Buscar ideias com ordenação por data
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/idea/?sortBy=created_at&sortOrder=asc"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | ideas | array |
  | pagination | object |
E as ideias devem estar ordenadas por data de criação (mais antigas primeiro)
```

### Cenário: Buscar ideias com ordenação por título
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/idea/?sortBy=title&sortOrder=desc"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | ideas | array |
  | pagination | object |
E as ideias devem estar ordenadas por título (Z-A)
```

### Cenário: Buscar ideias com múltiplos filtros
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/idea/?search=app&authorId=author-123&tags=mobile&page=0&limit=10&sortBy=created_at&sortOrder=desc"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | ideas | array |
  | pagination | object |
E as ideias devem atender a todos os critérios de filtro
E devem estar ordenadas por data de criação (mais recentes primeiro)
E devem ter no máximo 10 itens
```

### Cenário: Buscar ideias sem autenticação
```gherkin
Dado que não estou autenticado
Quando envio uma requisição GET para "/v1/idea/"
Então devo receber uma resposta 401 com erro "UNAUTHORIZED"
```

### Cenário: Buscar ideias com parâmetros inválidos
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/idea/?page=-1&limit=0"
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Buscar ideias com sortBy inválido
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/idea/?sortBy=invalid_field"
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Buscar ideias com sortOrder inválido
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/idea/?sortOrder=invalid_order"
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Erro interno do servidor
```gherkin
Dado que estou autenticado como usuário
E o banco de dados está indisponível
Quando envio uma requisição GET para "/v1/idea/"
Então devo receber uma resposta 500 com erro "DATABASE_ERROR"
```

## Formato de Resposta

### Sucesso na Busca de Ideias (200)
```json
{
  "ideas": [
    {
      "id": "idea-uuid-123",
      "title": "Revolutionary Mobile App",
      "description": "A detailed description of the mobile app idea...",
      "authorId": "user-profile-uuid",
      "author": {
        "id": "user-profile-uuid",
        "displayName": "João Silva",
        "icon": "https://example.com/avatar.jpg"
      },
      "tags": [
        {
          "id": "tag-uuid-1",
          "name": "mobile"
        },
        {
          "id": "tag-uuid-2",
          "name": "innovation"
        }
      ],
      "images": [
        {
          "id": "image-uuid-1",
          "src": "https://example.com/image1.jpg",
          "alt": "App screenshot",
          "width": 800,
          "height": 600
        }
      ],
      "links": [
        {
          "id": "link-uuid-1",
          "url": "https://example.com/demo"
        }
      ],
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z",
      "_count": {
        "likes": 15,
        "views": 120,
        "comments": 8
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
- **400**: Erros de validação (parâmetros inválidos)
- **401**: `UNAUTHORIZED` (usuário não autenticado)
- **500**: `DATABASE_ERROR` (erro interno do servidor)

## Parâmetros de Query

### Parâmetros de Busca
- **search** (opcional): Texto para buscar no título e descrição
- **authorId** (opcional): ID do autor para filtrar ideias
- **tags** (opcional): Array de tags para filtrar (ex: `?tags=tag1,tag2`)

### Parâmetros de Paginação
- **page** (opcional): Número da página (padrão: 0)
- **limit** (opcional): Número de itens por página (padrão: 10)

### Parâmetros de Ordenação
- **sortBy** (opcional): Campo para ordenação (`created_at`, `updated_at`, `title`)
- **sortOrder** (opcional): Ordem da classificação (`asc`, `desc`)

## Estrutura de Dados

### Ideia (IdeaResponse)
- **id**: ID único da ideia
- **title**: Título da ideia
- **description**: Descrição detalhada
- **authorId**: ID do autor
- **author**: Informações do autor (id, displayName, icon)
- **tags**: Array de tags associadas
- **images**: Array de imagens associadas
- **links**: Array de links associados
- **created_at**: Data de criação
- **updated_at**: Data da última atualização
- **_count**: Métricas de engajamento (likes, views, comments)

### Paginação
- **page**: Página atual
- **limit**: Itens por página
- **total**: Total de itens
- **totalPages**: Total de páginas
- **hasNext**: Se há próxima página
- **hasPrev**: Se há página anterior

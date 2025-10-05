# Feature: Get Idea By Id

## Descrição
Retorna os detalhes de uma ideia pelo seu ID, incluindo autor, tags, imagens e métricas.

## Endpoint
`GET /v1/feed/ideas/{id}`

## Path Parameters
- **id**: UUID da ideia

## Response
```json
{
  "id": "uuid",
  "title": "Idea title",
  "description": "...",
  "images": [],
  "tags": [],
  "author": { "id": "uuid", "username": "user" },
  "likes": 5,
  "views": 20,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

## Regras de Negócio
- Inclui relacionamentos essenciais (autor, tags, imagens)

## Validações
- **id**: UUID válido

## Tratamento de Erros
- **404**: Ideia não encontrada

## Segurança
- Público

## Dependências
- **Idea/Image/Tag/User Entities**
- **TypeORM** para carregamento de relacionamentos



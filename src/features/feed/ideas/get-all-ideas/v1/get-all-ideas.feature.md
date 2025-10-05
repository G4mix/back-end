# Feature: Get All Ideas

## Descrição
Lista ideias paginadas com filtros opcionais, incluindo metadados de likes e views.

## Endpoint
`GET /v1/feed/ideas`

## Query Params (opcionais)
- **page**: número da página (default 1)
- **limit**: itens por página (default 10)
- **tags**: lista de UUIDs (CSV)
- **authorId**: filtra por autor (UUID)
- **search**: termo de busca em título/descrição

## Response
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Idea title",
      "description": "...",
      "likes": 5,
      "views": 20,
      "author": { "id": "uuid", "username": "user" },
      "tags": []
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 1 }
}
```

## Regras de Negócio
- Ordenação por **data de criação** desc por padrão
- Suporta **paginação** e **filtros**

## Validações
- **page/limit**: inteiros positivos
- **tags**: CSV de UUIDs válidos
- **authorId**: UUID válido

## Tratamento de Erros
- **400**: Parâmetros inválidos

## Segurança
- Público, mas pode retornar campos diferentes se autenticado

## Dependências
- **Idea/Tag/User Entities**
- **parseArraySafe.ts** para parse de listas



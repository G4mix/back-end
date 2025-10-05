# Feature: Get All Comments

## Descrição
Lista comentários de uma ideia, com suporte a paginação.

## Endpoint
`GET /v1/feed/ideas/{ideaId}/comments`

## Path Parameters
- **ideaId**: UUID da ideia

## Query Params (opcionais)
- **page**: número da página (default 1)
- **limit**: itens por página (default 10)

## Response
```json
{
  "data": [
    {
      "id": "uuid",
      "content": "Great idea!",
      "author": { "id": "uuid", "username": "user" },
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 1 }
}
```

## Regras de Negócio
- Ordenação por **data de criação** asc ou desc (default desc)

## Validações
- **ideaId**: UUID válido
- **page/limit**: inteiros positivos

## Tratamento de Erros
- **404**: Ideia não encontrada
- **400**: Parâmetros inválidos

## Segurança
- Público

## Dependências
- **Comment Entity**, **Idea Entity**
- **TypeORM**



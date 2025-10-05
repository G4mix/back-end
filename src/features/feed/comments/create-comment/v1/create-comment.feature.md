# Feature: Create Comment

## Descrição
Cria um comentário em uma ideia existente.

## Endpoint
`POST /v1/feed/ideas/{ideaId}/comments`

## Path Parameters
- **ideaId**: UUID da ideia

## Request Body
```json
{
  "content": "Great idea!"
}
```

## Response
```json
{
  "id": "uuid",
  "content": "Great idea!",
  "author": { "id": "uuid", "username": "user" },
  "ideaId": "uuid",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

## Regras de Negócio
- **Autenticação obrigatória**
- Comentário vinculado a uma **ideia existente**

## Validações
- **ideaId**: UUID válido
- **content**: string, 1-1000 caracteres, obrigatório

## Tratamento de Erros
- **400**: Payload inválido
- **401**: Não autenticado
- **404**: Ideia não encontrada

## Segurança
- **JWT** obrigatório

## Dependências
- **Comment Entity**, **Idea Entity**, **User Entity**
- **TypeORM**, **Protected Decorator**, **JWT Strategy**



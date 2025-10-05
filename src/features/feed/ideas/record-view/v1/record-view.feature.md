# Feature: Record View

## Descrição
Registra uma visualização para uma ideia. Pode considerar o usuário autenticado ou um identificador anônimo.

## Endpoint
`POST /v1/feed/ideas/{id}/view`

## Path Parameters
- **id**: UUID da ideia

## Request Body (opcional)
```json
{
  "anonymousId": "string-optional"
}
```

## Response
```json
{
  "id": "uuid",
  "views": 21
}
```

## Regras de Negócio
- Incrementa contador de **views** da ideia
- Pode deduplicar por **usuário** autenticado ou **anonymousId** (quando aplicável)

## Validações
- **id**: UUID válido
- **anonymousId**: string (opcional)

## Tratamento de Erros
- **404**: Ideia não encontrada

## Segurança
- Público

## Dependências
- **View Entity**, **Idea Entity**
- **TypeORM**



# Feature: Update Idea

## Descrição
Atualiza os dados de uma ideia existente do usuário autenticado.

## Endpoint
`PUT /v1/feed/ideas/{id}`

## Path Parameters
- **id**: UUID da ideia

## Request Body
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "imageIds": ["uuid"],
  "tagIds": ["uuid"]
}
```

## Response
```json
{
  "id": "uuid",
  "title": "Updated title",
  "description": "Updated description",
  "images": [],
  "tags": [],
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

## Regras de Negócio
- **Autenticação obrigatória**
- Apenas o **autor** pode atualizar a ideia
- **Título** continua único por autor

## Validações
- **id**: UUID válido
- **title/description**: strings válidas (mesmos critérios de criação)
- **imageIds/tagIds**: arrays de UUIDs válidos (opcionais)

## Tratamento de Erros
- **400**: Payload inválido
- **401**: Não autenticado
- **403**: Usuário não é autor da ideia
- **404**: Ideia não encontrada
- **409**: Título já utilizado pelo mesmo autor

## Segurança
- **JWT** obrigatório
- **Controle de acesso** por propriedade do recurso

## Dependências
- **Idea Entity**, **Tag Entity**, **Image Entity**
- **TypeORM**, **JWT Strategy**, **Protected Decorator**



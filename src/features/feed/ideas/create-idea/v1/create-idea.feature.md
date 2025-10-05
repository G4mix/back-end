# Feature: Create Idea

## Descrição
Cria uma nova ideia na plataforma Gamix. Retorna a ideia criada com seus relacionamentos principais.

## Endpoint
`POST /v1/feed/ideas`

## Request Body
```json
{
  "title": "My awesome idea",
  "description": "A brief description about the idea",
  "imageIds": ["uuid"],
  "tagIds": ["uuid", "uuid"]
}
```

## Response
```json
{
  "id": "uuid",
  "title": "My awesome idea",
  "description": "A brief description about the idea",
  "images": [],
  "tags": [],
  "author": {
    "id": "uuid",
    "username": "username"
  },
  "likes": 0,
  "views": 0,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

## Regras de Negócio
- **Autenticação obrigatória** para criar ideias
- **Título** obrigatório e único por autor
- **Descrição** obrigatória
- **Tags** e **imagens** opcionais

## Validações
- **title**: string, 3-255 caracteres, obrigatório
- **description**: string, 3-2000 caracteres, obrigatório
- **imageIds/tagIds**: arrays de UUIDs válidos (opcionais)

## Tratamento de Erros
- **400**: Payload inválido
- **401**: Não autenticado
- **409**: Título já utilizado pelo mesmo autor

## Segurança
- **JWT** obrigatório
- **Sanitização** de strings para prevenir XSS/SQLi

## Dependências
- **Idea Entity**, **Tag Entity**, **Image Entity**, **User Entity**
- **TypeORM**: persistência
- **Protected Decorator** e **JWT Strategy**



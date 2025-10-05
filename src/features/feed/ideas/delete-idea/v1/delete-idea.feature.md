# Feature: Delete Idea

## Descrição
Remove uma ideia existente do usuário autenticado, incluindo relacionamentos dependentes.

## Endpoint
`DELETE /v1/feed/ideas/{id}`

## Path Parameters
- **id**: UUID da ideia

## Response
```json
{
  "message": "Idea deleted successfully",
  "deletedIdea": {
    "id": "uuid",
    "title": "Deleted title"
  }
}
```

## Regras de Negócio
- **Autenticação obrigatória**
- Apenas o **autor** pode deletar
- Deleção em **cascata** de likes, views e comentários

## Validações
- **id**: UUID válido

## Tratamento de Erros
- **401**: Não autenticado
- **403**: Usuário não é autor da ideia
- **404**: Ideia não encontrada

## Segurança
- **JWT** obrigatório
- **Controle de acesso** por propriedade

## Dependências
- **Idea/Comment/Like/View Entities**
- **TypeORM** com cascata
- **Protected Decorator**, **JWT Strategy**



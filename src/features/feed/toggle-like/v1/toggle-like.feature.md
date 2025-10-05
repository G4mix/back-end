# Feature: Toggle Like

## Descrição
Alterna o estado de like do usuário autenticado para uma ideia específica.

## Endpoint
`POST /v1/feed/ideas/{id}/toggle-like`

## Path Parameters
- **id**: UUID da ideia

## Response
```json
{
  "id": "uuid",
  "liked": true,
  "likes": 6
}
```

## Regras de Negócio
- **Autenticação obrigatória**
- Alterna entre **like** e **unlike**
- Atualiza contador agregado de likes

## Validações
- **id**: UUID válido

## Tratamento de Erros
- **401**: Não autenticado
- **404**: Ideia não encontrada

## Segurança
- **JWT** obrigatório

## Dependências
- **Like Entity**, **Idea Entity**, **User Entity**
- **TypeORM**, **Protected Decorator**, **JWT Strategy**

# Feature: Get All Users

## Descrição
Endpoint para listar todos os usuários da plataforma Gamix com paginação e busca. Retorna uma lista paginada de usuários excluindo o usuário atual da requisição.

## Endpoint
`GET /v1/user?page=0&quantity=10&search=`

## Query Parameters
- **page** (opcional): Número da página (padrão: 0)
- **quantity** (opcional): Quantidade de itens por página (padrão: 10)
- **search** (opcional): Termo de busca por username ou displayName

## Response
```json
{
  "page": 0,
  "nextPage": 1,
  "pages": 5,
  "total": 50,
  "data": [
    {
      "id": "uuid",
      "username": "username",
      "email": "user@example.com",
      "verified": true,
      "userProfile": {
        "id": "uuid",
        "displayName": "Display Name",
        "autobiography": "User bio",
        "links": [],
        "followers": [],
        "following": []
      }
    }
  ]
}
```

## Regras de Negócio
- **Autenticação obrigatória** (JWT token)
- **Exclui usuário atual** da lista retornada
- **Paginação** baseada em page e quantity
- **Busca** por username ou displayName (case-insensitive)
- **Relacionamentos** carregados: userProfile, links, followers, following
- **Ordenação** por data de criação (mais recentes primeiro)

## Validações
- **JWT Token**: Deve ser válido e não expirado
- **Page**: Número inteiro não negativo
- **Quantity**: Número inteiro positivo
- **Search**: String opcional

## Tratamento de Erros
- **401**: Token JWT inválido ou expirado
- **400**: Parâmetros de query inválidos
- **422**: Validação de campos falhou

## Segurança
- **Autenticação JWT** obrigatória
- **Proteção** contra acesso não autorizado
- **Exclusão** do usuário atual da lista
- **Validação** de parâmetros de entrada

## Dependências
- **User Entity**: Para busca de usuários
- **JWT Strategy**: Para validação de token
- **Protected Decorator**: Para controle de acesso
- **TypeORM**: Para operações de banco de dados

## Paginação
- **Page**: Índice da página (começando em 0)
- **Quantity**: Itens por página
- **Total**: Total de registros
- **Pages**: Total de páginas
- **NextPage**: Próxima página (null se última)

## Busca
- **Campo**: username ou userProfile.displayName
- **Tipo**: Case-insensitive (ILIKE)
- **Operador**: LIKE com wildcards (%)
- **Comportamento**: Busca parcial em ambos os campos

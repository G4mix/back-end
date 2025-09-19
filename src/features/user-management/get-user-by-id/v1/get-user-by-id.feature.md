# Feature: Get User By ID

## Descrição
Endpoint para buscar um usuário específico pelo ID do perfil. Retorna informações detalhadas do usuário incluindo perfil, links e relacionamentos.

## Endpoint
`GET /v1/user/{userProfileId}`

## Path Parameters
- **userProfileId**: ID do perfil do usuário a ser buscado

## Response
```json
{
  "id": "uuid",
  "username": "username",
  "email": "user@example.com",
  "verified": true,
  "userProfile": {
    "id": "uuid",
    "displayName": "Display Name",
    "bio": "User bio",
    "links": [
      {
        "id": "uuid",
        "title": "GitHub",
        "url": "https://github.com/user",
        "type": "social"
      }
    ],
    "followers": [
      {
        "id": "uuid",
        "followerId": "uuid",
        "followingId": "uuid"
      }
    ],
    "following": [
      {
        "id": "uuid",
        "followerId": "uuid",
        "followingId": "uuid"
      }
    ]
  }
}
```

## Regras de Negócio
- **Autenticação obrigatória** (JWT token)
- **Busca por userProfileId** (não userId)
- **Relacionamentos** carregados: userProfile, links, followers, following
- **Informações sensíveis** podem ser filtradas baseadas no usuário atual

## Validações
- **JWT Token**: Deve ser válido e não expirado
- **userProfileId**: Deve ser um UUID válido
- **Usuário**: Deve existir no banco de dados

## Tratamento de Erros
- **401**: Token JWT inválido ou expirado
- **404**: Usuário não encontrado
- **400**: Parâmetros inválidos
- **422**: Validação de campos falhou

## Segurança
- **Autenticação JWT** obrigatória
- **Proteção** contra acesso não autorizado
- **Validação** de parâmetros de entrada
- **Filtragem** de informações sensíveis

## Dependências
- **User Entity**: Para busca do usuário
- **UserProfile Entity**: Para informações do perfil
- **Link Entity**: Para links do usuário
- **Follow Entity**: Para relacionamentos
- **JWT Strategy**: Para validação de token
- **Protected Decorator**: Para controle de acesso

## Relacionamentos
- **userProfile**: Perfil principal do usuário
- **links**: Links sociais e profissionais
- **followers**: Usuários que seguem este usuário
- **following**: Usuários que este usuário segue

## Casos de Uso
- **Visualização de perfil** público
- **Busca de usuário** por ID
- **Informações** para sistema de seguidores
- **Links** e informações de contato

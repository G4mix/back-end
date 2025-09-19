# Feature: Delete User

## Descrição
Endpoint para deletar um usuário da plataforma Gamix. Remove permanentemente o usuário e todos os dados associados.

## Endpoint
`DELETE /v1/user/{userProfileId}`

## Path Parameters
- **userProfileId**: ID do perfil do usuário a ser deletado

## Response
```json
{
  "message": "User deleted successfully",
  "deletedUser": {
    "id": "uuid",
    "username": "username",
    "email": "user@example.com"
  }
}
```

## Regras de Negócio
- **Autenticação obrigatória** (JWT token)
- **Deleção permanente** do usuário e dados associados
- **Cascata** para relacionamentos (userProfile, links, follows)
- **Verificação** de existência do usuário antes da deleção
- **Log** da operação de deleção

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
- **Confirmação** de existência do usuário

## Dependências
- **User Entity**: Para busca e deleção do usuário
- **UserProfile Entity**: Para deleção em cascata
- **Link Entity**: Para deleção em cascata
- **Follow Entity**: Para deleção em cascata
- **JWT Strategy**: Para validação de token
- **Protected Decorator**: Para controle de acesso

## Operações de Cascata
- **UserProfile**: Deletado automaticamente
- **Links**: Deletados automaticamente
- **Follows**: Relacionamentos deletados automaticamente
- **UserCode**: Código único deletado automaticamente

## Logs
- **Operação**: Registro da deleção
- **Usuário**: ID e informações do usuário deletado
- **Timestamp**: Data e hora da operação
- **Resultado**: Sucesso ou falha da operação

## Casos de Uso
- **Deleção de conta** pelo próprio usuário
- **Moderação** de usuários inapropriados
- **Limpeza** de dados de teste
- **GDPR** - Direito ao esquecimento

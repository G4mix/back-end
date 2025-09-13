# Funcionalidade: Deletar Conta de Usuário

## Visão Geral
Permite que usuários autenticados deletem permanentemente suas próprias contas e todos os dados associados, incluindo perfil, imagens, posts, comentários e relacionamentos.

## Regras de Negócio
- Usuário deve estar autenticado
- Apenas o próprio usuário pode deletar sua conta
- Ação é permanente e irreversível
- Remove todos os dados associados (perfil, imagens, posts, comentários, likes, relacionamentos)
- Remove arquivos do armazenamento em nuvem
- Token de autenticação se torna inválido após deleção
- ID deve ser um UUID válido

## Cenários

### Cenário: Deletar própria conta com sucesso
```gherkin
Dado que estou autenticado como usuário com ID "user-uuid-123"
Quando envio uma requisição DELETE para "/v1/user/user-uuid-123"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | message | string |
E message deve ser "USER_DELETED_SUCCESSFULLY"
E minha conta deve ser permanentemente deletada
E minhas imagens de perfil devem ser removidas do armazenamento
E todos os meus dados associados devem ser removidos
```

### Cenário: Tentar deletar conta de outro usuário
```gherkin
Dado que estou autenticado como usuário com ID "user-a-uuid"
Quando envio uma requisição DELETE para "/v1/user/user-b-uuid"
Então devo receber uma resposta 403 com erro "FORBIDDEN"
E a conta do outro usuário deve permanecer inalterada
```

### Cenário: Deletar conta de usuário inexistente
```gherkin
Dado que estou autenticado como usuário com ID "user-uuid-123"
Quando envio uma requisição DELETE para "/v1/user/user-inexistente"
Então devo receber uma resposta 404 com erro "USER_NOT_FOUND"
```

### Cenário: Deletar conta sem autenticação
```gherkin
Dado que não estou autenticado
Quando envio uma requisição DELETE para "/v1/user/user-uuid-123"
Então devo receber uma resposta 401 com erro "UNAUTHORIZED"
```

### Cenário: Deletar conta com ID inválido
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição DELETE para "/v1/user/id-invalido"
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Deletar conta com dados associados
```gherkin
Dado que estou autenticado como usuário com ID "user-uuid-123"
E minha conta possui posts, comentários, likes e relacionamentos
Quando envio uma requisição DELETE para "/v1/user/user-uuid-123"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | message | string |
E message deve ser "USER_DELETED_SUCCESSFULLY"
E todos os dados associados devem ser removidos (cascade delete)
E arquivos de imagem devem ser removidos do armazenamento
```

### Cenário: Erro interno do servidor
```gherkin
Dado que estou autenticado como usuário com ID "user-uuid-123"
E o banco de dados está indisponível
Quando envio uma requisição DELETE para "/v1/user/user-uuid-123"
Então devo receber uma resposta 500 com erro "DATABASE_ERROR"
```

## Formato de Resposta

### Resposta de Sucesso (200)
```json
{
  "message": "USER_DELETED_SUCCESSFULLY"
}
```

### Respostas de Erro
- **400**: Erros de validação (ID inválido)
- **401**: `UNAUTHORIZED` (usuário não autenticado)
- **403**: `FORBIDDEN` (usuário não pode deletar conta de outro usuário)
- **404**: `USER_NOT_FOUND` (usuário não encontrado)
- **500**: `DATABASE_ERROR` (erro interno do servidor)

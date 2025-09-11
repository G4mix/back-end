# Funcionalidade: Alterar Senha

## Visão Geral
Permite que usuários autenticados alterem sua senha atual por uma nova senha.

## Regras de Negócio
- Usuário deve estar autenticado (token JWT válido)
- Nova senha deve ter pelo menos 8 caracteres
- Nova senha deve conter pelo menos: 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial
- Após alteração, novos tokens são gerados automaticamente
- Token de refresh é atualizado no banco de dados

## Cenários

### Cenário: Alteração de senha bem-sucedida
```gherkin
Dado que sou um usuário autenticado
Quando envio uma requisição POST para "/v1/auth/change-password" com:
  | Campo | Valor |
  | password | "NewPassword123!" |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | accessToken | string |
  | refreshToken | string |
  | user | object |
E novos tokens devem ser gerados
E o token de refresh deve ser atualizado no banco de dados
```

### Cenário: Alterar senha com senha fraca
```gherkin
Dado que sou um usuário autenticado
Quando envio uma requisição POST para "/v1/auth/change-password" com:
  | Campo | Valor |
  | password | "weak" |
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Alterar senha sem autenticação
```gherkin
Dado que não estou autenticado
Quando envio uma requisição POST para "/v1/auth/change-password"
Então devo receber uma resposta 401 com erro "UNAUTHORIZED"
```

### Cenário: Alterar senha para usuário inexistente
```gherkin
Dado que sou um usuário autenticado com token inválido
Quando envio uma requisição POST para "/v1/auth/change-password"
Então devo receber uma resposta 404 com erro "USER_NOT_FOUND"
```

## Formato de Resposta

### Resposta de Sucesso (200)
```json
{
  "accessToken": "jwt_token",
  "refreshToken": "jwt_token",
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "verified": boolean,
    "created_at": "datetime",
    "updated_at": "datetime",
    "userProfileId": "uuid",
    "loginAttempts": number,
    "blockedUntil": "datetime|null",
    "userProfile": {
      "id": "uuid",
      "name": "string|null",
      "bio": "string|null",
      "icon": "string|null",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  }
}
```

### Respostas de Erro
- **400**: Erros de validação para formato da senha
- **401**: `UNAUTHORIZED`
- **404**: `USER_NOT_FOUND`
- **500**: `PASSWORD_CHANGE_FAILED`

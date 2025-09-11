# Funcionalidade: Cadastro de Usuário

## Visão Geral
Permite que novos usuários se registrem no sistema criando uma conta com email, senha e username.

## Regras de Negócio
- Email deve ser único no sistema
- Email deve ser verificado via AWS SES
- Senha deve ter pelo menos 8 caracteres com critérios de segurança
- Username deve ter entre 3-20 caracteres (letras, números, underscore)
- Usuário é criado automaticamente com perfil associado
- Tokens são gerados automaticamente após criação

## Cenários

### Cenário: Cadastro de usuário bem-sucedido
```gherkin
Dado que não existe usuário com email "newuser@example.com"
Quando envio uma requisição POST para "/v1/auth/signup" com:
  | Campo | Valor |
  | email | "newuser@example.com" |
  | password | "SecurePass123!" |
  | username | "newuser" |
Então devo receber uma resposta 201 com:
  | Campo | Tipo |
  | accessToken | string |
  | refreshToken | string |
  | user | object |
E um novo usuário deve ser criado no banco de dados
E a verificação de email deve ser iniciada
```

### Cenário: Cadastro com email existente
```gherkin
Dado que existe um usuário com email "existing@example.com"
Quando envio uma requisição POST para "/v1/auth/signup" com:
  | Campo | Valor |
  | email | "existing@example.com" |
  | password | "SecurePass123!" |
  | username | "newuser" |
Então devo receber uma resposta 409 com erro "USER_ALREADY_EXISTS"
```

### Cenário: Cadastro com senha fraca
```gherkin
Quando envio uma requisição POST para "/v1/auth/signup" com:
  | Campo | Valor |
  | email | "user@example.com" |
  | password | "weak" |
  | username | "newuser" |
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Cadastro com formato de email inválido
```gherkin
Quando envio uma requisição POST para "/v1/auth/signup" com:
  | Campo | Valor |
  | email | "invalid-email" |
  | password | "SecurePass123!" |
  | username | "newuser" |
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Cadastro com username inválido
```gherkin
Quando envio uma requisição POST para "/v1/auth/signup" com:
  | Campo | Valor |
  | email | "user@example.com" |
  | password | "SecurePass123!" |
  | username | "ab" |
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Cadastro com falha na verificação de email
```gherkin
Dado que a verificação de email falha para "user@example.com"
Quando envio uma requisição POST para "/v1/auth/signup" com:
  | Campo | Valor |
  | email | "user@example.com" |
  | password | "SecurePass123!" |
  | username | "newuser" |
Então devo receber uma resposta 500 com erro "EMAIL_VERIFICATION_FAILED"
```

## Formato de Resposta

### Resposta de Sucesso (201)
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
- **400**: Erros de validação para formato de email, senha ou username
- **409**: `USER_ALREADY_EXISTS`
- **500**: `EMAIL_VERIFICATION_FAILED`, `USER_CREATION_FAILED`

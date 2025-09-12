# Funcionalidade: Login de Usuário

## Visão Geral
Permite que usuários autentiquem no sistema usando email e senha, com recursos de segurança avançados incluindo verificação de email, limitação de tentativas de login e geração de tokens de acesso.

## Regras de Negócio
- Email deve ser válido e existir no sistema
- Senha deve estar correta
- Usuário deve ter email verificado (verificação automática via SES)
- Máximo de 5 tentativas de login por sessão
- Conta é bloqueada por 30 minutos após 5 tentativas falhadas
- Gera access token e refresh token
- Atualiza automaticamente status de verificação de email

## Cenários

### Cenário: Login bem-sucedido com usuário verificado
```gherkin
Dado que existe um usuário com email "user@example.com" e senha "password123"
E o usuário está verificado
Quando envio uma requisição POST para "/v1/auth/signin" com:
  | Campo | Valor |
  | email | "user@example.com" |
  | password | "password123" |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | accessToken | string |
  | refreshToken | string |
  | user | object |
E o usuário deve conter id, username, email e verified
```

### Cenário: Login com verificação automática de email
```gherkin
Dado que existe um usuário com email "user@example.com" e senha "password123"
E o usuário não está verificado
E o email foi verificado no SES
Quando envio uma requisição POST para "/v1/auth/signin" com:
  | Campo | Valor |
  | email | "user@example.com" |
  | password | "password123" |
Então devo receber uma resposta 200
E o usuário deve ser marcado como verificado
E um email de boas-vindas deve ser enviado
```

### Cenário: Login com usuário inexistente
```gherkin
Dado que não existe usuário com email "nonexistent@example.com"
Quando envio uma requisição POST para "/v1/auth/signin" com:
  | Campo | Valor |
  | email | "nonexistent@example.com" |
  | password | "password123" |
Então devo receber uma resposta 404 com erro "USER_NOT_FOUND"
```

### Cenário: Login com senha incorreta (primeira tentativa)
```gherkin
Dado que existe um usuário com email "user@example.com" e senha "password123"
Quando envio uma requisição POST para "/v1/auth/signin" com:
  | Campo | Valor |
  | email | "user@example.com" |
  | password | "wrongpassword" |
Então devo receber uma resposta 401 com erro "WRONG_PASSWORD_ONCE"
E o contador de tentativas deve ser incrementado
```

### Cenário: Login com senha incorreta (múltiplas tentativas)
```gherkin
Dado que existe um usuário com email "user@example.com" e senha "password123"
E o usuário já tentou fazer login 4 vezes com senha incorreta
Quando envio uma requisição POST para "/v1/auth/signin" com:
  | Campo | Valor |
  | email | "user@example.com" |
  | password | "wrongpassword" |
Então devo receber uma resposta 401 com erro "WRONG_PASSWORD_FIVE_TIMES"
E a conta deve ser bloqueada por 30 minutos
```

### Cenário: Login com conta bloqueada
```gherkin
Dado que existe um usuário com email "user@example.com" e senha "password123"
E o usuário está bloqueado por excesso de tentativas
Quando envio uma requisição POST para "/v1/auth/signin" com:
  | Campo | Valor |
  | email | "user@example.com" |
  | password | "password123" |
Então devo receber uma resposta 429 com erro "EXCESSIVE_LOGIN_ATTEMPTS"
```

### Cenário: Login com email inválido
```gherkin
Quando envio uma requisição POST para "/v1/auth/signin" com:
  | Campo | Valor |
  | email | "invalid-email" |
  | password | "password123" |
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Login com senha vazia
```gherkin
Quando envio uma requisição POST para "/v1/auth/signin" com:
  | Campo | Valor |
  | email | "user@example.com" |
  | password | "" |
Então devo receber uma resposta 400 com erro de validação
```

## Formato de Resposta

### Sucesso no Login (200)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "user@example.com",
    "verified": true,
    "userProfile": {
      "id": "profile-uuid",
      "name": "John Doe",
      "bio": "User bio",
      "avatar": "avatar-url"
    }
  }
}
```

### Respostas de Erro
- **400**: Erros de validação (email inválido, campos obrigatórios)
- **401**: `WRONG_PASSWORD_ONCE`, `WRONG_PASSWORD_TWICE`, `WRONG_PASSWORD_THREE_TIMES`, `WRONG_PASSWORD_FOUR_TIMES`, `WRONG_PASSWORD_FIVE_TIMES`
- **404**: `USER_NOT_FOUND`
- **429**: `EXCESSIVE_LOGIN_ATTEMPTS`
- **500**: Erro interno do servidor

## Recursos de Segurança
- Verificação automática de status de email via AWS SES
- Limitação de tentativas de login (máximo 5)
- Bloqueio temporário da conta (30 minutos)
- Reset automático do contador após período de bloqueio
- Validação de senha com bcrypt
- Geração segura de tokens JWT

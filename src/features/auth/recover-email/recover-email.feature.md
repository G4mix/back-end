# Funcionalidade: Recuperar Email

## Visão Geral
Permite que usuários recuperem acesso à sua conta através de um código enviado por email.

## Regras de Negócio
- Código de recuperação tem 6 caracteres alfanuméricos
- Código expira em 10 minutos
- Email deve ser válido e existir no sistema
- Código é enviado via AWS SES
- Token temporário é gerado após verificação do código

## Cenários

### Cenário: Envio de email de recuperação bem-sucedido
```gherkin
Dado que existe um usuário com email "user@example.com"
Quando envio uma requisição POST para "/v1/auth/send-recover-email" com:
  | Campo | Valor |
  | email | "user@example.com" |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | email | string |
E um código de recuperação deve ser enviado para o email
E o código deve ser salvo no banco de dados
```

### Cenário: Enviar email de recuperação para usuário inexistente
```gherkin
Dado que não existe usuário com email "nonexistent@example.com"
Quando envio uma requisição POST para "/v1/auth/send-recover-email" com:
  | Campo | Valor |
  | email | "nonexistent@example.com" |
Então devo receber uma resposta 404 com erro "USER_NOT_FOUND"
```

### Cenário: Verificação de código de recuperação bem-sucedida
```gherkin
Dado que um código de recuperação foi enviado para "user@example.com"
Quando envio uma requisição POST para "/v1/auth/verify-email-code" com:
  | Campo | Valor |
  | code | "ABC123" |
  | email | "user@example.com" |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | accessToken | string |
E o token deve permitir alteração de senha
```

### Cenário: Verificar código de recuperação expirado
```gherkin
Dado que um código de recuperação expirado foi enviado para "user@example.com"
Quando envio uma requisição POST para "/v1/auth/verify-email-code" com:
  | Campo | Valor |
  | code | "ABC123" |
  | email | "user@example.com" |
Então devo receber uma resposta 400 com erro "CODE_EXPIRED"
```

### Cenário: Verificar código de recuperação inválido
```gherkin
Dado que um código de recuperação foi enviado para "user@example.com"
Quando envio uma requisição POST para "/v1/auth/verify-email-code" com:
  | Campo | Valor |
  | code | "WRONG" |
  | email | "user@example.com" |
Então devo receber uma resposta 400 com erro "CODE_NOT_EQUALS"
```

### Cenário: Enviar email de recuperação com formato inválido
```gherkin
Quando envio uma requisição POST para "/v1/auth/send-recover-email" com:
  | Campo | Valor |
  | email | "invalid-email" |
Então devo receber uma resposta 400 com erro de validação
```

## Formato de Resposta

### Sucesso no Envio de Email de Recuperação (200)
```json
{
  "email": "user@example.com"
}
```

### Sucesso na Verificação de Código (200)
```json
{
  "accessToken": "jwt_token"
}
```

### Respostas de Erro
- **400**: `CODE_EXPIRED`, `CODE_NOT_EQUALS`, erros de validação
- **404**: `USER_NOT_FOUND`
- **500**: `EMAIL_SEND_FAILED`

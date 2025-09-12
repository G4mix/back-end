# Funcionalidade: Verificar Código de Email

## Visão Geral
Permite que usuários verifiquem o código de recuperação enviado por email e obtenham um token temporário para alterar a senha.

## Regras de Negócio
- Código de recuperação tem 6 caracteres alfanuméricos
- Código expira em 10 minutos
- Email deve ser válido e existir no sistema
- Token temporário é gerado após verificação do código
- Token permite apenas alteração de senha

## Cenários

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

### Cenário: Verificar código para usuário inexistente
```gherkin
Dado que não existe usuário com email "nonexistent@example.com"
Quando envio uma requisição POST para "/v1/auth/verify-email-code" com:
  | Campo | Valor |
  | code | "ABC123" |
  | email | "nonexistent@example.com" |
Então devo receber uma resposta 404 com erro "USER_NOT_FOUND"
```

### Cenário: Verificar código com formato inválido
```gherkin
Quando envio uma requisição POST para "/v1/auth/verify-email-code" com:
  | Campo | Valor |
  | code | "123" |
  | email | "user@example.com" |
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Verificar código com email inválido
```gherkin
Quando envio uma requisição POST para "/v1/auth/verify-email-code" com:
  | Campo | Valor |
  | code | "ABC123" |
  | email | "invalid-email" |
Então devo receber uma resposta 400 com erro de validação
```

## Formato de Resposta

### Sucesso na Verificação de Código (200)
```json
{
  "accessToken": "jwt_token"
}
```

### Respostas de Erro
- **400**: `CODE_EXPIRED`, `CODE_NOT_EQUALS`, erros de validação
- **404**: `USER_NOT_FOUND`
- **500**: Erro interno do servidor

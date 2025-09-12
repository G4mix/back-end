# Funcionalidade: Enviar Email de Recuperação

## Visão Geral
Permite que usuários recebam um código de recuperação por email para recuperar acesso à sua conta.

## Regras de Negócio
- Código de recuperação tem 6 caracteres alfanuméricos
- Código expira em 10 minutos
- Email deve ser válido e existir no sistema
- Código é enviado via AWS SES

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

# Funcionalidade: Renovar Token

## Visão Geral
Permite que usuários renovem seus tokens de acesso usando o token de refresh válido.

## Regras de Negócio
- Token de refresh deve ser válido e não expirado
- Usuário deve existir no sistema
- Novos tokens são gerados automaticamente
- Token de refresh é atualizado no banco de dados
- Token de acesso tem duração padrão
- Token de refresh tem duração estendida

## Cenários

### Cenário: Renovação de token bem-sucedida
```gherkin
Dado que tenho um token de refresh válido
Quando envio uma requisição POST para "/api/v1/auth/refresh-token" com:
  | Campo | Valor |
  | token | "valid_refresh_token" |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | accessToken | string |
  | refreshToken | string |
E novos tokens devem ser gerados
E o token de refresh deve ser atualizado no banco de dados
```

### Cenário: Renovar com token inválido
```gherkin
Dado que tenho um token de refresh inválido
Quando envio uma requisição POST para "/api/v1/auth/refresh-token" com:
  | Campo | Valor |
  | token | "invalid_token" |
Então devo receber uma resposta 401 com erro "UNAUTHORIZED"
```

### Cenário: Renovar com token expirado
```gherkin
Dado que tenho um token de refresh expirado
Quando envio uma requisição POST para "/api/v1/auth/refresh-token" com:
  | Campo | Valor |
  | token | "expired_token" |
Então devo receber uma resposta 401 com erro "UNAUTHORIZED"
```

### Cenário: Renovar token para usuário inexistente
```gherkin
Dado que tenho um token para um usuário inexistente
Quando envio uma requisição POST para "/api/v1/auth/refresh-token" com:
  | Campo | Valor |
  | token | "token_for_deleted_user" |
Então devo receber uma resposta 404 com erro "USER_NOT_FOUND"
```

### Cenário: Renovar token sem campo token
```gherkin
Quando envio uma requisição POST para "/api/v1/auth/refresh-token" com:
  | Campo | Valor |
  | token | "" |
Então devo receber uma resposta 400 com erro de validação
```

## Formato de Resposta

### Resposta de Sucesso (200)
```json
{
  "accessToken": "jwt_token",
  "refreshToken": "jwt_token"
}
```

### Respostas de Erro
- **400**: Erros de validação para formato do token
- **401**: `UNAUTHORIZED`
- **404**: `USER_NOT_FOUND`
- **500**: `TOKEN_REFRESH_FAILED`

# Funcionalidade: Login Social

## Visão Geral
Permite que usuários façam login ou se registrem usando contas de redes sociais (Google, LinkedIn, GitHub).

## Regras de Negócio
- Suporta Google, LinkedIn e GitHub
- Se usuário não existe, cria automaticamente
- Se usuário existe mas não tem provider linkado, retorna erro
- Permite linkar múltiplos providers à mesma conta
- Tokens são gerados automaticamente após login
- Senha aleatória é gerada para novos usuários

## Cenários

### Cenário: Login social bem-sucedido para novo usuário
```gherkin
Dado que não existe usuário com email "social@example.com"
Quando envio uma requisição POST para "/api/v1/auth/social-login/google" com:
  | Campo | Valor |
  | token | "valid_google_token" |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | accessToken | string |
  | refreshToken | string |
  | user | object |
E um novo usuário deve ser criado
E o provider OAuth deve ser linkado
```

### Cenário: Login social bem-sucedido para usuário existente
```gherkin
Dado que existe um usuário com conta Google linkada "social@example.com"
Quando envio uma requisição POST para "/api/v1/auth/social-login/google" com:
  | Campo | Valor |
  | token | "valid_google_token" |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | accessToken | string |
  | refreshToken | string |
  | user | object |
```

### Cenário: Login social com email existente mas sem provider linkado
```gherkin
Dado que existe um usuário com email "social@example.com" mas sem conta Google linkada
Quando envio uma requisição POST para "/api/v1/auth/social-login/google" com:
  | Campo | Valor |
  | token | "valid_google_token" |
Então devo receber uma resposta 400 com erro "PROVIDER_NOT_LINKED"
```

### Cenário: Login social com token inválido
```gherkin
Quando envio uma requisição POST para "/api/v1/auth/social-login/google" com:
  | Campo | Valor |
  | token | "invalid_token" |
Então devo receber uma resposta 404 com erro "USER_NOT_FOUND"
```

### Cenário: Linkar novo provider OAuth com sucesso
```gherkin
Dado que sou um usuário autenticado
Quando envio uma requisição POST para "/api/v1/auth/link-new-oauth-provider/linkedin" com:
  | Campo | Valor |
  | token | "valid_linkedin_token" |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | success | boolean |
E o provider LinkedIn deve ser linkado à minha conta
```

### Cenário: Linkar provider já linkado
```gherkin
Dado que sou um usuário autenticado com conta LinkedIn linkada
Quando envio uma requisição POST para "/api/v1/auth/link-new-oauth-provider/linkedin" com:
  | Campo | Valor |
  | token | "valid_linkedin_token" |
Então devo receber uma resposta 400 com erro "PROVIDER_ALREADY_LINKED"
```

### Cenário: Redirecionamento de callback de login social
```gherkin
Dado que um usuário inicia o fluxo OAuth com Google
Quando acesso "/api/v1/auth/callback/google" com código válido
Então devo ser redirecionado para o app móvel com token ou erro
```

## Formato de Resposta

### Sucesso no Login Social (200)
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

### Sucesso ao Linkar Provider (200)
```json
{
  "success": true
}
```

### Respostas de Erro
- **400**: `PROVIDER_NOT_LINKED`, `PROVIDER_ALREADY_LINKED`
- **401**: `UNAUTHORIZED` (para linkar provider)
- **404**: `USER_NOT_FOUND`
- **500**: `SOCIAL_LOGIN_FAILED`, `PROVIDER_LINK_FAILED`

# Funcionalidade: Vincular Provedor OAuth

## Visão Geral
Permite que usuários autenticados vinculem provedores OAuth adicionais (Google, LinkedIn, GitHub) à sua conta existente, habilitando login com múltiplas contas sociais usando a mesma conta da aplicação.

## Regras de Negócio
- Usuário deve estar autenticado
- Token social deve ser válido
- Provedor não pode estar vinculado a outra conta
- Suporta múltiplos provedores OAuth simultaneamente
- Validação rigorosa de tokens sociais
- Verificação de vinculações existentes

## Cenários

### Cenário: Vincular provedor Google com sucesso
```gherkin
Dado que estou autenticado como usuário
E tenho um token válido do Google
E o provedor Google não está vinculado a outra conta
Quando envio uma requisição POST para "/v1/auth/link-new-oauth-provider/google" com:
  | Campo | Valor |
  | token | "google-access-token-123" |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | success | boolean |
E success deve ser true
E o provedor Google deve ser vinculado à minha conta
```

### Cenário: Vincular provedor LinkedIn com sucesso
```gherkin
Dado que estou autenticado como usuário
E tenho um token válido do LinkedIn
E o provedor LinkedIn não está vinculado a outra conta
Quando envio uma requisição POST para "/v1/auth/link-new-oauth-provider/linkedin" com:
  | Campo | Valor |
  | token | "linkedin-access-token-456" |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | success | boolean |
E success deve ser true
E o provedor LinkedIn deve ser vinculado à minha conta
```

### Cenário: Vincular provedor GitHub com sucesso
```gherkin
Dado que estou autenticado como usuário
E tenho um token válido do GitHub
E o provedor GitHub não está vinculado a outra conta
Quando envio uma requisição POST para "/v1/auth/link-new-oauth-provider/github" com:
  | Campo | Valor |
  | token | "github-access-token-789" |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | success | boolean |
E success deve ser true
E o provedor GitHub deve ser vinculado à minha conta
```

### Cenário: Tentar vincular provedor já vinculado
```gherkin
Dado que estou autenticado como usuário
E tenho um token válido do Google
E o provedor Google já está vinculado a outra conta
Quando envio uma requisição POST para "/v1/auth/link-new-oauth-provider/google" com:
  | Campo | Valor |
  | token | "google-access-token-123" |
Então devo receber uma resposta 400 com erro "PROVIDER_ALREADY_LINKED"
```

### Cenário: Vincular provedor sem autenticação
```gherkin
Dado que não estou autenticado
Quando envio uma requisição POST para "/v1/auth/link-new-oauth-provider/google" com:
  | Campo | Valor |
  | token | "google-access-token-123" |
Então devo receber uma resposta 401 com erro "UNAUTHORIZED"
```

### Cenário: Vincular provedor com token inválido
```gherkin
Dado que estou autenticado como usuário
E tenho um token inválido do Google
Quando envio uma requisição POST para "/v1/auth/link-new-oauth-provider/google" com:
  | Campo | Valor |
  | token | "token-invalido" |
Então devo receber uma resposta 404 com erro "USER_NOT_FOUND"
```

### Cenário: Vincular provedor sem token
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição POST para "/v1/auth/link-new-oauth-provider/google" com:
  | Campo | Valor |
  | {} | {} |
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Vincular provedor não suportado
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição POST para "/v1/auth/link-new-oauth-provider/facebook" com:
  | Campo | Valor |
  | token | "facebook-access-token" |
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Erro interno do servidor
```gherkin
Dado que estou autenticado como usuário
E tenho um token válido do Google
E o banco de dados está indisponível
Quando envio uma requisição POST para "/v1/auth/link-new-oauth-provider/google" com:
  | Campo | Valor |
  | token | "google-access-token-123" |
Então devo receber uma resposta 500 com erro "DATABASE_ERROR"
```

## Formato de Resposta

### Resposta de Sucesso (200)
```json
{
  "success": true
}
```

### Respostas de Erro
- **400**: `PROVIDER_ALREADY_LINKED`, erros de validação (provedor não suportado, token ausente)
- **401**: `UNAUTHORIZED` (usuário não autenticado)
- **404**: `USER_NOT_FOUND` (token social inválido)
- **500**: `DATABASE_ERROR` (erro interno do servidor)

## Parâmetros de Rota

### Parâmetros Obrigatórios
- **provider**: Nome do provedor social (`google`, `linkedin`, `github`)

## Campos de Entrada

### Campos Obrigatórios
- **token**: Token de acesso do provedor social

## Provedores Suportados

### Google
- **Endpoint**: `/v1/auth/link-new-oauth-provider/google`
- **Validação**: Token de acesso do Google OAuth 2.0

### LinkedIn
- **Endpoint**: `/v1/auth/link-new-oauth-provider/linkedin`
- **Validação**: Token de acesso do LinkedIn OAuth 2.0

### GitHub
- **Endpoint**: `/v1/auth/link-new-oauth-provider/github`
- **Validação**: Token de acesso do GitHub OAuth 2.0

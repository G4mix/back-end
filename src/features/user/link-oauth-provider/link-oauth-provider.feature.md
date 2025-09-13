# Link OAuth Provider Feature

## Visão Geral

A funcionalidade **Link OAuth Provider** permite que usuários autenticados vinculem provedores OAuth adicionais (Google, LinkedIn, GitHub) à sua conta existente. Isso habilita os usuários a fazer login com múltiplas contas sociais usando a mesma conta da aplicação.

## Endpoint

```
POST /v1/auth/link-new-oauth-provider/{provider}
```

### Parâmetros de Rota

- `provider` (string, obrigatório): Nome do provedor social
  - Valores aceitos: `google`, `linkedin`, `github`

### Corpo da Requisição

```json
{
  "token": "string"
}
```

- `token` (string, obrigatório): Token de acesso do provedor social

### Headers

- `Authorization: Bearer <jwt_token>` (obrigatório): Token JWT válido do usuário autenticado

## Respostas

### Sucesso (200)

```json
{
  "success": true
}
```

### Erros

#### 400 - PROVIDER_ALREADY_LINKED
```json
{
  "message": "PROVIDER_ALREADY_LINKED"
}
```
O provedor já está vinculado a outra conta.

#### 401 - UNAUTHORIZED
```json
{
  "message": "UNAUTHORIZED"
}
```
Token JWT inválido ou ausente.

#### 404 - USER_NOT_FOUND
```json
{
  "message": "USER_NOT_FOUND"
}
```
Usuário não encontrado ou token social inválido.

## Fluxo de Processamento

1. **Validação de Autenticação**: Verifica se o token JWT é válido
2. **Validação do Token Social**: Valida o token do provedor social via AuthGateway
3. **Recuperação do Perfil**: Obtém dados do usuário do provedor social
4. **Verificação de Usuário**: Confirma se o usuário autenticado existe no sistema
5. **Verificação de Vinculação**: Verifica se o provedor já está vinculado a outra conta
6. **Vinculação**: Vincula o provedor à conta do usuário atual

## Casos de Uso

### Cenário 1: Vinculação Bem-sucedida
- Usuário autenticado com JWT válido
- Token social válido
- Provedor não vinculado a outra conta
- Usuário existe no sistema

### Cenário 2: Provedor Já Vinculado
- Usuário autenticado com JWT válido
- Token social válido
- Provedor já vinculado a outra conta
- Retorna erro `PROVIDER_ALREADY_LINKED`

### Cenário 3: Token Social Inválido
- Usuário autenticado com JWT válido
- Token social inválido ou expirado
- Retorna erro `USER_NOT_FOUND`

### Cenário 4: Usuário Não Autenticado
- Token JWT ausente ou inválido
- Retorna erro `UNAUTHORIZED`

## Dependências

- **AuthGateway**: Validação de tokens sociais
- **UserRepository**: Operações de banco de dados
- **JWT Middleware**: Validação de autenticação

## Segurança

- Requer autenticação JWT válida
- Validação rigorosa de tokens sociais
- Verificação de vinculações existentes
- Logs de auditoria para operações sensíveis

## Exemplos de Uso

### JavaScript/TypeScript

```typescript
// Vincular conta Google
const response = await fetch('/v1/auth/link-new-oauth-provider/google', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify({
    token: googleAccessToken
  })
});

if (response.ok) {
  const result = await response.json();
  console.log('Provedor vinculado com sucesso:', result);
} else {
  const error = await response.json();
  console.error('Erro ao vincular provedor:', error.message);
}
```

### cURL

```bash
curl -X POST \
  'https://api.example.com/v1/auth/link-new-oauth-provider/google' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -d '{
    "token": "GOOGLE_ACCESS_TOKEN"
  }'
```

## Notas de Implementação

- A funcionalidade utiliza o padrão Repository para acesso a dados
- Implementa validação automática via middleware
- Utiliza decorador `@LogResponseTime` para monitoramento de performance
- Suporta múltiplos provedores OAuth simultaneamente

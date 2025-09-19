# Feature: Refresh Token

## Descrição
Endpoint para renovação de tokens de acesso usando o refresh token. Permite que usuários mantenham sua sessão ativa sem precisar fazer login novamente.

## Endpoint
`POST /v1/auth/refresh-token`

## Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Response
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Regras de Negócio
- **Refresh token válido** deve ser fornecido
- **Usuário deve existir** no banco de dados
- **Novos tokens** são gerados (access e refresh)
- **Refresh token antigo** é substituído pelo novo
- **Expiração** de 1 hora para access token e 7 dias para refresh token

## Validações
- **Refresh Token**: String obrigatória e válida
- **Usuário**: Deve existir no banco de dados
- **Token**: Deve ser um JWT válido e não expirado

## Tratamento de Erros
- **400**: Refresh token inválido ou expirado
- **401**: Usuário não encontrado
- **422**: Validação de campos falhou

## Segurança
- **JWT tokens** seguros com chave secreta
- **Rotação de tokens** para maior segurança
- **Validação** de assinatura do token
- **Verificação** de expiração

## Dependências
- **User Entity**: Para busca e validação do usuário
- **JWT Service**: Para geração e validação de tokens
- **TypeORM**: Para operações de banco de dados

## Fluxo de Autenticação
1. **Login inicial** → Retorna access + refresh tokens
2. **Access token expira** → Usar refresh token para renovar
3. **Refresh token expira** → Fazer login novamente
4. **Logout** → Invalidar refresh token (se implementado)

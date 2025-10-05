# Feature: Sign In

## Descrição
Endpoint para autenticação de usuários na plataforma Gamix. Permite que usuários façam login com email e senha, retornando tokens de acesso e refresh.

## Endpoint
`POST /v1/auth/signin`

## Request Body
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

## Response
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "username",
    "email": "user@example.com",
    "verified": true,
    "userProfile": {
      "id": "uuid",
      "displayName": "Display Name",
      "autobiography": "User bio",
      "links": [],
      "followers": [],
      "following": []
    }
  }
}
```

## Regras de Negócio
- **Máximo 5 tentativas de login** por usuário
- **Bloqueio temporário** de 30 minutos após 5 tentativas falhadas
- **Verificação de email** obrigatória (comentada no código)
- **Senha** deve ser validada com bcrypt
- **Tokens JWT** com expiração de 1 hora para access e 7 dias para refresh
- **Relacionamentos** carregados: userProfile, links, followers, following

## Validações
- **Email**: Formato válido e obrigatório
- **Password**: String obrigatória
- **Usuário**: Deve existir no banco de dados
- **Senha**: Deve coincidir com o hash armazenado

## Tratamento de Erros
- **400**: Senha ou e-mail incorretos
- **429**: Muitas tentativas de login (conta bloqueada temporariamente)

## Segurança
- **Rate limiting** implícito através do contador de tentativas
- **Hash bcrypt** para comparação de senhas
- **JWT tokens** seguros com chave secreta
- **Bloqueio temporário** para prevenir ataques de força bruta

## Dependências
- **User Entity**: Para busca e validação do usuário
- **JWT Service**: Para geração de tokens
- **BCrypt**: Para comparação de senhas
- **TypeORM**: Para operações de banco de dados

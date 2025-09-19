# Feature: Sign Up

## Descrição
Endpoint para registro de novos usuários na plataforma Gamix. Permite que usuários criem uma conta com username, email e senha, retornando tokens de acesso e refresh.

## Endpoint
`POST /v1/auth/signup`

## Request Body
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "username": "username"
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
    "verified": false,
    "userProfile": {
      "id": "uuid",
      "displayName": "Display Name",
      "bio": "User bio",
      "links": [],
      "followers": [],
      "following": []
    }
  }
}
```

## Regras de Negócio
- **Email único** no sistema
- **Username único** no sistema
- **Senha forte** com critérios específicos
- **Verificação de email** obrigatória (comentada no código)
- **Tokens JWT** com expiração de 1 hora para access e 7 dias para refresh
- **Relacionamentos** carregados: userProfile, links, followers, following

## Validações

### Email
- **Formato válido** e obrigatório
- **Único** no sistema

### Password
- **Mínimo 6 caracteres**
- **Pelo menos 1 dígito** (0-9)
- **Pelo menos 1 letra maiúscula** (A-Z)
- **Pelo menos 1 caractere especial** ($*&@#! )
- **Não pode conter** { ou }
- **Obrigatório**

### Username
- **Mínimo 3 caracteres**
- **Máximo 255 caracteres**
- **Não pode conter** { ou }
- **Obrigatório**

## Tratamento de Erros
- **400**: Dados inválidos ou usuário já existe
- **409**: Email ou username já cadastrado
- **422**: Validação de campos falhou

## Segurança
- **Hash bcrypt** para senhas
- **JWT tokens** seguros com chave secreta
- **Validação rigorosa** de senhas
- **Prevenção** de caracteres perigosos

## Dependências
- **User Entity**: Para criação do usuário
- **UserCode Entity**: Para código único do usuário
- **UserProfile Entity**: Para perfil do usuário
- **JWT Service**: Para geração de tokens
- **BCrypt**: Para hash de senhas
- **TypeORM**: Para operações de banco de dados

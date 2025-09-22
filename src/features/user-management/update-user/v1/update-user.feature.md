# Update User Feature

## Visão Geral
Esta feature permite que usuários autenticados atualizem suas informações pessoais, incluindo dados básicos, perfil e upload de imagens (ícone e imagem de fundo).

## Rota

### PATCH `/v1/user`

**Descrição:** Atualiza informações do usuário autenticado.

**Autenticação:** Requerida (Bearer Token)

**Versão:** v1

**Content-Type:** `multipart/form-data`

## Parâmetros

### Form Data

#### Campos Básicos do Usuário
| Campo | Tipo | Obrigatório | Descrição | Validação |
|-------|------|-------------|-----------|-----------|
| `username` | string | Não | Nome de usuário | 3-50 caracteres, sem {} |
| `email` | string | Não | Email do usuário | Formato de email válido |
| `password` | string | Não | Nova senha | Mínimo 6 caracteres, deve conter: número, maiúscula, símbolo especial |

#### Perfil do Usuário (JSON)
| Campo | Tipo | Obrigatório | Descrição | Validação |
|-------|------|-------------|-----------|-----------|
| `userProfile` | JSON string | Não | Dados do perfil | Objeto JSON com campos do perfil |

**Estrutura do userProfile:**
```json
{
  "displayName": "string",      // 3-300 caracteres, sem {}
  "autobiography": "string",    // 3-500 caracteres, sem {}
  "links": ["string"]           // Array de URLs válidas (http/https)
}
```

#### Upload de Arquivos
| Campo | Tipo | Obrigatório | Descrição | Validação |
|-------|------|-------------|-----------|-----------|
| `icon` | File | Não | Ícone do usuário | JPEG/PNG, máx 15MB |
| `backgroundImage` | File | Não | Imagem de fundo | JPEG/PNG, máx 15MB |

## Respostas

### 200 OK
**Descrição:** Usuário atualizado com sucesso

**Exemplo:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "username": "newusername",
  "email": "newemail@example.com",
  "verified": false,
  "userProfile": {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "displayName": "New Display Name",
    "autobiography": "This is my biography",
    "icon": "https://gamix-public.s3.amazonaws.com/user-123/icon.jpg",
    "backgroundImage": "https://gamix-public.s3.amazonaws.com/user-123/background.jpg",
    "links": [
      {
        "id": "789e0123-e89b-12d3-a456-426614174002",
        "url": "https://github.com/user"
      }
    ],
    "followers": 5,
    "following": 10
  },
  "userCode": {
    "id": "012e3456-e89b-12d3-a456-426614174003",
    "code": null
  }
}
```

### 400 Bad Request
**Descrição:** Erro de validação nos dados enviados

**Possíveis erros:**
- `INVALID_NAME` - Nome de usuário inválido
- `INVALID_EMAIL` - Email inválido
- `INVALID_PASSWORD` - Senha não atende aos critérios
- `INVALID_AUTOBIOGRAPHY` - Autobiografia inválida
- `INVALID_LINK` - URL inválida nos links
- `LINK_TOO_LONG` - Link muito longo
- `LINKS_MUST_BE_ARRAY` - Links devem ser um array

**Exemplo:**
```json
{
  "statusCode": 400,
  "message": ["INVALID_NAME", "INVALID_EMAIL"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
**Descrição:** Token de autenticação inválido ou ausente

**Exemplo:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 500 Internal Server Error
**Descrição:** Erro interno do servidor (ex: falha no upload para S3)

**Exemplo:**
```json
{
  "statusCode": 500,
  "message": "PICTURE_UPDATE_FAIL"
}
```

## Comportamento

### Atualização de Dados Básicos
- **Username:** Atualiza o nome de usuário
- **Email:** Atualiza o email e marca como não verificado (`verified: false`)
- **Password:** Criptografa e atualiza a senha

### Atualização de Perfil
- **Display Name:** Nome de exibição do usuário
- **Autobiography:** Biografia do usuário
- **Links:** Array de links externos (GitHub, LinkedIn, etc.)

### Upload de Imagens
- **Icon:** Ícone do usuário (avatar)
- **Background Image:** Imagem de fundo do perfil
- Imagens são enviadas para AWS S3
- URLs são geradas automaticamente

### Criação de Perfil
- Se o usuário não tem perfil, um novo é criado
- Se já existe perfil, os dados são atualizados

## Exemplos de Uso

### Atualizar dados básicos
```bash
curl -X PATCH http://localhost:3000/v1/user \
  -H "Authorization: Bearer <token>" \
  -F "username=newusername" \
  -F "email=newemail@example.com"
```

### Atualizar perfil
```bash
curl -X PATCH http://localhost:3000/v1/user \
  -H "Authorization: Bearer <token>" \
  -F 'userProfile={"displayName":"New Name","autobiography":"My bio","links":["https://github.com/user"]}'
```

### Upload de ícone
```bash
curl -X PATCH http://localhost:3000/v1/user \
  -H "Authorization: Bearer <token>" \
  -F "icon=@/path/to/icon.jpg" \
  -F 'userProfile={"displayName":"User Name"}'
```

### Upload de imagem de fundo
```bash
curl -X PATCH http://localhost:3000/v1/user \
  -H "Authorization: Bearer <token>" \
  -F "backgroundImage=@/path/to/background.jpg" \
  -F 'userProfile={"displayName":"User Name"}'
```

### Atualização completa
```bash
curl -X PATCH http://localhost:3000/v1/user \
  -H "Authorization: Bearer <token>" \
  -F "username=newuser" \
  -F "email=new@example.com" \
  -F "password=NewPass123!" \
  -F "icon=@/path/to/icon.jpg" \
  -F "backgroundImage=@/path/to/background.jpg" \
  -F 'userProfile={"displayName":"Full Name","autobiography":"Complete bio","links":["https://github.com/user","https://linkedin.com/in/user"]}'
```

## Notas Técnicas

- **Content-Type:** Deve ser `multipart/form-data` para suportar upload de arquivos
- **Validação:** Todos os campos são opcionais, mas quando fornecidos devem passar na validação
- **S3 Integration:** Imagens são automaticamente enviadas para AWS S3
- **Email Verification:** Mudança de email marca o usuário como não verificado
- **Password Hashing:** Senhas são automaticamente criptografadas com bcrypt
- **Profile Creation:** Perfil é criado automaticamente se não existir
- **Links Management:** Links antigos são substituídos pelos novos
- **File Limits:** Máximo 15MB por arquivo, formatos JPEG/PNG

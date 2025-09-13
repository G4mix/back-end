# Funcionalidade: Atualizar Usuário

## Visão Geral
Permite que usuários autenticados atualizem suas informações pessoais, incluindo nome, bio e foto de perfil.

## Regras de Negócio
- Usuário deve estar autenticado (token JWT válido)
- Foto deve ser menor que 5MB
- Tipos de arquivo suportados: JPEG, PNG, GIF, WebP
- Nome deve ter entre 1 e 50 caracteres
- Bio deve ter no máximo 500 caracteres
- Usuário só pode atualizar seus próprios dados

## Cenários

### Cenário: Atualização de usuário bem-sucedida com todos os campos
```gherkin
Dado que sou um usuário autenticado
Quando envio uma requisição PUT para "/v1/user/{userId}" com:
  | Campo | Valor |
  | name  | "João Silva" |
  | bio   | "Desenvolvedor Full Stack" |
  | icon  | [arquivo de imagem] |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | success | boolean |
  | user | object |
E os dados do usuário devem ser atualizados no banco de dados
```

### Cenário: Atualização de usuário bem-sucedida com dados parciais
```gherkin
Dado que sou um usuário autenticado
Quando envio uma requisição PUT para "/v1/user/{userId}" com:
  | Campo | Valor |
  | name  | "João Silva" |
Então devo receber uma resposta 200
E apenas o campo name deve ser atualizado
```

### Cenário: Atualizar usuário com tamanho de arquivo inválido
```gherkin
Dado que sou um usuário autenticado
Quando envio uma requisição PUT para "/v1/user/{userId}" com:
  | Campo | Valor |
  | icon  | [arquivo maior que 5MB] |
Então devo receber uma resposta 400 com erro "FILE_TOO_LARGE"
```

### Cenário: Atualizar usuário com tipo de arquivo não suportado
```gherkin
Dado que sou um usuário autenticado
Quando envio uma requisição PUT para "/v1/user/{userId}" com:
  | Campo | Valor |
  | icon  | [arquivo PDF] |
Então devo receber uma resposta 400 com erro "UNSUPPORTED_FILE_TYPE"
```

### Cenário: Atualizar usuário sem autenticação
```gherkin
Dado que não estou autenticado
Quando envio uma requisição PUT para "/v1/user/{userId}"
Então devo receber uma resposta 401 com erro "UNAUTHORIZED"
```

### Cenário: Atualizar dados de outro usuário
```gherkin
Dado que sou um usuário autenticado
Quando envio uma requisição PUT para "/v1/user/{anotherUserId}"
Então devo receber uma resposta 403 com erro "FORBIDDEN"
```

### Cenário: Atualizar usuário inexistente
```gherkin
Dado que sou um usuário autenticado
Quando envio uma requisição PUT para "/v1/user/{nonExistentUserId}"
Então devo receber uma resposta 404 com erro "USER_NOT_FOUND"
```

## Formato de Resposta

### Resposta de Sucesso (200)
```json
{
  "success": true,
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

### Respostas de Erro
- **400**: `FILE_TOO_LARGE`, `UNSUPPORTED_FILE_TYPE`
- **401**: `UNAUTHORIZED`
- **403**: `FORBIDDEN`
- **404**: `USER_NOT_FOUND`
- **500**: `UPLOAD_ERROR`, `UPDATE_ERROR`

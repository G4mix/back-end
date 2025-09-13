# Funcionalidade: Buscar Usuário por ID

## Visão Geral
Permite que usuários autenticados busquem informações detalhadas de um usuário específico pelo seu ID único, incluindo dados do perfil e métricas de engajamento.

## Regras de Negócio
- Usuário deve estar autenticado
- ID deve ser um UUID válido
- Retorna informações completas do usuário e perfil
- Inclui contadores de seguidores/seguindo em tempo real
- Email é incluído na resposta para requisições autenticadas
- Suporta visualização de qualquer usuário do sistema

## Cenários

### Cenário: Buscar usuário existente por ID
```gherkin
Dado que estou autenticado como usuário
E existe um usuário com ID "user-uuid-123"
Quando envio uma requisição GET para "/v1/user/user-uuid-123"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | user | object |
E user deve conter id, username, email, verified, created_at, updated_at, userProfile
E userProfile deve conter id, icon, displayName, autobiography, backgroundImage, isFollowing, links, followersCount, followingCount
```

### Cenário: Buscar usuário inexistente por ID
```gherkin
Dado que estou autenticado como usuário
E não existe um usuário com ID "user-inexistente"
Quando envio uma requisição GET para "/v1/user/user-inexistente"
Então devo receber uma resposta 404 com erro "USER_NOT_FOUND"
```

### Cenário: Buscar usuário com formato de ID inválido
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/user/id-invalido"
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Buscar usuário sem autenticação
```gherkin
Dado que não estou autenticado
Quando envio uma requisição GET para "/v1/user/user-uuid-123"
Então devo receber uma resposta 401 com erro "UNAUTHORIZED"
```

### Cenário: Buscar usuário com ID vazio
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/user/"
Então devo receber uma resposta 404 (rota não encontrada)
```

### Cenário: Buscar usuário com UUID malformado
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição GET para "/v1/user/123-invalid-uuid"
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Erro interno do servidor
```gherkin
Dado que estou autenticado como usuário
E existe um usuário com ID "user-uuid-123"
E o banco de dados está indisponível
Quando envio uma requisição GET para "/v1/user/user-uuid-123"
Então devo receber uma resposta 500 com erro "DATABASE_ERROR"
```

## Formato de Resposta

### Resposta de Sucesso (200)
```json
{
  "user": {
    "id": "user-uuid-123",
    "username": "joao_silva",
    "email": "joao@example.com",
    "verified": true,
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z",
    "userProfile": {
      "id": "profile-uuid-123",
      "icon": "https://example.com/avatar.jpg",
      "displayName": "João Silva",
      "autobiography": "Desenvolvedor Full Stack apaixonado por tecnologia",
      "backgroundImage": "https://example.com/bg.jpg",
      "isFollowing": false,
      "links": [
        "https://github.com/joao",
        "https://linkedin.com/in/joao"
      ],
      "followersCount": 25,
      "followingCount": 15
    }
  }
}
```

### Respostas de Erro
- **400**: Erros de validação (ID inválido, formato incorreto)
- **401**: `UNAUTHORIZED` (usuário não autenticado)
- **404**: `USER_NOT_FOUND` (usuário não encontrado)
- **500**: `DATABASE_ERROR` (erro interno do servidor)

# Funcionalidade: Atualizar Ideia

## Visão Geral
Permite que usuários autenticados atualizem suas próprias ideias. Apenas o autor da ideia pode modificá-la, permitindo atualizações parciais ou completas dos campos disponíveis.

## Regras de Negócio
- Usuário deve estar autenticado
- Apenas o autor da ideia pode atualizá-la
- Suporta atualizações parciais (apenas campos fornecidos)
- Atualiza automaticamente o timestamp de modificação
- Valida dados de entrada conforme regras de negócio
- Mantém integridade dos dados existentes

## Cenários

### Cenário: Atualizar ideia própria com sucesso
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com ID "idea-123" criada por mim
Quando envio uma requisição PUT para "/v1/idea/idea-123" com:
  | Campo | Valor |
  | title | "Título Atualizado" |
  | description | "Descrição atualizada da ideia" |
  | summary | "Resumo atualizado" |
  | tags | "nova,tag,atualizada" |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | idea | object |
E a ideia deve conter os dados atualizados
E updated_at deve ser diferente de created_at
```

### Cenário: Tentar atualizar ideia de outro usuário
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com ID "idea-123" criada por outro usuário
Quando envio uma requisição PUT para "/v1/idea/idea-123" com:
  | Campo | Valor |
  | title | "Título Tentativa" |
Então devo receber uma resposta 403 com erro "FORBIDDEN"
E a ideia não deve ser atualizada
```

### Cenário: Atualizar ideia inexistente
```gherkin
Dado que estou autenticado como usuário
E não existe uma ideia com ID "idea-inexistente" no sistema
Quando envio uma requisição PUT para "/v1/idea/idea-inexistente" com:
  | Campo | Valor |
  | title | "Título Tentativa" |
Então devo receber uma resposta 404 com erro "IDEA_NOT_FOUND"
```

### Cenário: Atualizar ideia sem autenticação
```gherkin
Dado que não estou autenticado
Quando envio uma requisição PUT para "/v1/idea/idea-123" com:
  | Campo | Valor |
  | title | "Título Tentativa" |
Então devo receber uma resposta 401 com erro "UNAUTHORIZED"
```

### Cenário: Atualizar apenas título
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com ID "idea-123" criada por mim
Quando envio uma requisição PUT para "/v1/idea/idea-123" com:
  | Campo | Valor |
  | title | "Novo Título" |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | idea | object |
E apenas o título deve ser atualizado
E description deve manter o valor original
```

### Cenário: Atualizar com dados inválidos
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com ID "idea-123" criada por mim
Quando envio uma requisição PUT para "/v1/idea/idea-123" com:
  | Campo | Valor |
  | title | "Curto" |
  | description | "Muito curta" |
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Atualizar com ID inválido
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição PUT para "/v1/idea/id-invalido" com:
  | Campo | Valor |
  | title | "Título Tentativa" |
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Erro interno do servidor
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com ID "idea-123" criada por mim
E o banco de dados está indisponível
Quando envio uma requisição PUT para "/v1/idea/idea-123" com:
  | Campo | Valor |
  | title | "Título Tentativa" |
Então devo receber uma resposta 500 com erro "DATABASE_ERROR"
```

## Formato de Resposta

### Resposta de Sucesso (200)
```json
{
  "idea": {
    "id": "idea-uuid-123",
    "title": "Título Atualizado",
    "description": "Descrição atualizada da ideia...",
    "summary": "Resumo atualizado",
    "tags": "nova,tag,atualizada",
    "authorId": "user-profile-uuid",
    "author": {
      "id": "user-profile-uuid",
      "displayName": "João Silva",
      "icon": "https://example.com/avatar.jpg"
    },
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T12:00:00.000Z",
    "_count": {
      "likes": 15,
      "views": 120,
      "comments": 8
    }
  }
}
```

### Respostas de Erro
- **400**: Erros de validação (dados inválidos, ID inválido)
- **401**: `UNAUTHORIZED` (usuário não autenticado)
- **403**: `FORBIDDEN` (usuário não é o autor da ideia)
- **404**: `IDEA_NOT_FOUND` (ideia não encontrada)
- **500**: `DATABASE_ERROR` (erro interno do servidor)

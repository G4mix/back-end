# Funcionalidade: Deletar Ideia

## Visão Geral
Permite que usuários autenticados deletem suas próprias ideias. Apenas o autor da ideia pode deletá-la e esta ação é irreversível, removendo todos os dados relacionados.

## Regras de Negócio
- Usuário deve estar autenticado
- Apenas o autor da ideia pode deletá-la
- Ação é irreversível
- Remove todos os dados relacionados (comentários, likes, visualizações)
- Suporta cascade delete para manter integridade dos dados

## Cenários

### Cenário: Deletar ideia própria com sucesso
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com ID "idea-123" criada por mim
Quando envio uma requisição DELETE para "/v1/idea/idea-123"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | message | string |
E message deve ser "Idea deleted successfully"
E a ideia deve ser removida do banco de dados
```

### Cenário: Tentar deletar ideia de outro usuário
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com ID "idea-123" criada por outro usuário
Quando envio uma requisição DELETE para "/v1/idea/idea-123"
Então devo receber uma resposta 403 com erro "FORBIDDEN"
E a ideia não deve ser deletada
```

### Cenário: Deletar ideia inexistente
```gherkin
Dado que estou autenticado como usuário
E não existe uma ideia com ID "idea-inexistente" no sistema
Quando envio uma requisição DELETE para "/v1/idea/idea-inexistente"
Então devo receber uma resposta 404 com erro "IDEA_NOT_FOUND"
```

### Cenário: Deletar ideia sem autenticação
```gherkin
Dado que não estou autenticado
Quando envio uma requisição DELETE para "/v1/idea/idea-123"
Então devo receber uma resposta 401 com erro "UNAUTHORIZED"
```

### Cenário: Deletar ideia com comentários e likes
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com ID "idea-123" criada por mim
E a ideia possui comentários e likes associados
Quando envio uma requisição DELETE para "/v1/idea/idea-123"
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | message | string |
E message deve ser "Idea deleted successfully"
E a ideia e todos os dados relacionados devem ser removidos
```

### Cenário: Deletar ideia com ID inválido
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição DELETE para "/v1/idea/id-invalido"
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Erro interno do servidor
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com ID "idea-123" criada por mim
E o banco de dados está indisponível
Quando envio uma requisição DELETE para "/v1/idea/idea-123"
Então devo receber uma resposta 500 com erro "DATABASE_ERROR"
```

## Formato de Resposta

### Resposta de Sucesso (200)
```json
{
  "message": "Idea deleted successfully"
}
```

### Respostas de Erro
- **400**: Erros de validação (ID inválido)
- **401**: `UNAUTHORIZED` (usuário não autenticado)
- **403**: `FORBIDDEN` (usuário não é o autor da ideia)
- **404**: `IDEA_NOT_FOUND` (ideia não encontrada)
- **500**: `DATABASE_ERROR` (erro interno do servidor)

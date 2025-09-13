# Funcionalidade: Criar Ideia

## Visão Geral
Esta funcionalidade permite que usuários autenticados criem novas ideias no sistema. As ideias são associadas ao perfil do usuário autenticado e ficam visíveis para outros usuários conforme as regras de visibilidade da plataforma.

## Regras de Negócio
- Apenas usuários autenticados podem criar ideias
- O título deve ter entre 10 e 100 caracteres
- A descrição deve ter entre 50 e 2000 caracteres
- O resumo é opcional e deve ter no máximo 500 caracteres
- As tags são opcionais e devem ter no máximo 1000 caracteres
- A ideia é automaticamente associada ao perfil do usuário autenticado
- O sistema deve gerar um ID único para cada ideia
- Os timestamps de criação e atualização são definidos automaticamente

## Cenários

### Cenário: Criar ideia com sucesso
```gherkin
Dado que estou autenticado como usuário
E tenho dados válidos para uma nova ideia
Quando envio uma requisição POST para "/v1/idea/" com:
  | Campo | Valor |
  | title | "Minha Nova Ideia" |
  | description | "Esta é uma descrição detalhada da minha ideia..." |
  | summary | "Resumo da ideia" |
  | tags | "inovação,tecnologia" |
Então devo receber uma resposta 201 com:
  | Campo | Tipo |
  | idea | object |
E a ideia deve conter id, title, description, summary, tags, authorId e timestamps
```

### Cenário: Tentar criar ideia sem autenticação
```gherkin
Dado que não estou autenticado
Quando envio uma requisição POST para "/v1/idea/" com:
  | Campo | Valor |
  | title | "Minha Nova Ideia" |
  | description | "Esta é uma descrição detalhada da minha ideia..." |
Então devo receber uma resposta 401 com erro "UNAUTHORIZED"
```

### Cenário: Criar ideia com dados inválidos
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição POST para "/v1/idea/" com:
  | Campo | Valor |
  | title | "Curto" |
  | description | "Descrição muito curta" |
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Erro interno do servidor
```gherkin
Dado que estou autenticado como usuário
E tenho dados válidos para uma nova ideia
E o banco de dados está indisponível
Quando envio uma requisição POST para "/v1/idea/" com:
  | Campo | Valor |
  | title | "Minha Nova Ideia" |
  | description | "Esta é uma descrição detalhada da minha ideia..." |
Então devo receber uma resposta 500 com erro "DATABASE_ERROR"
```

## Formato de Resposta

### Resposta de Sucesso (201)
```json
{
  "idea": {
    "id": "idea-uuid-123",
    "title": "Título da Ideia",
    "description": "Descrição detalhada da ideia...",
    "summary": "Resumo da ideia",
    "tags": "tag1,tag2,tag3",
    "authorId": "user-profile-uuid",
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  }
}
```

### Respostas de Erro
- **400**: Erros de validação (título muito curto, descrição muito longa, etc.)
- **401**: `UNAUTHORIZED` (usuário não autenticado)
- **500**: `DATABASE_ERROR` (erro interno do servidor)

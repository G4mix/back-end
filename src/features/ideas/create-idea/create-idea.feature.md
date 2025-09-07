# Feature: Criar Ideia

## Descrição
Esta feature permite que usuários autenticados criem novas ideias no sistema. As ideias são associadas ao perfil do usuário autenticado e ficam visíveis para outros usuários conforme as regras de visibilidade da plataforma.

## Cenários

### Cenário 1: Criar ideia com sucesso
**Dado** que um usuário está autenticado
**E** possui dados válidos para uma nova ideia
**Quando** o usuário envia uma requisição POST para `/api/v1/ideas/`
**Então** a ideia deve ser criada com sucesso
**E** deve retornar status 201
**E** deve retornar os dados da ideia criada incluindo ID e timestamps

### Cenário 2: Tentar criar ideia sem autenticação
**Dado** que um usuário não está autenticado
**Quando** o usuário tenta enviar uma requisição POST para `/api/v1/ideas/`
**Então** deve retornar status 401
**E** deve retornar mensagem "UNAUTHORIZED"

### Cenário 3: Criar ideia com dados inválidos
**Dado** que um usuário está autenticado
**E** envia dados inválidos (título muito curto, descrição muito longa, etc.)
**Quando** o usuário envia uma requisição POST para `/api/v1/ideas/`
**Então** deve retornar status 400
**E** deve retornar mensagem "VALIDATION_ERROR"
**E** deve incluir detalhes dos erros de validação

### Cenário 4: Erro interno do servidor
**Dado** que um usuário está autenticado
**E** envia dados válidos
**E** ocorre um erro interno no servidor
**Quando** o usuário envia uma requisição POST para `/api/v1/ideas/`
**Então** deve retornar status 500
**E** deve retornar mensagem "DATABASE_ERROR"

## Dados de Entrada

### Campos Obrigatórios
- **title**: Título da ideia (10-100 caracteres)
- **description**: Descrição detalhada da ideia (50-2000 caracteres)

### Campos Opcionais
- **summary**: Resumo da ideia (máximo 500 caracteres)
- **tags**: Tags relacionadas à ideia (máximo 1000 caracteres)

## Dados de Saída

### Sucesso (201)
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

### Erro (401)
```json
"UNAUTHORIZED"
```

### Erro (400)
```json
"VALIDATION_ERROR"
```

### Erro (500)
```json
"DATABASE_ERROR"
```

## Regras de Negócio
1. Apenas usuários autenticados podem criar ideias
2. O título deve ter entre 10 e 100 caracteres
3. A descrição deve ter entre 50 e 2000 caracteres
4. O resumo é opcional e deve ter no máximo 500 caracteres
5. As tags são opcionais e devem ter no máximo 1000 caracteres
6. A ideia é automaticamente associada ao perfil do usuário autenticado
7. O sistema deve gerar um ID único para cada ideia
8. Os timestamps de criação e atualização são definidos automaticamente

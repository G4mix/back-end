# Atualizar Ideia

## Funcionalidade
Permite atualizar uma ideia existente. Apenas o autor da ideia pode atualizá-la.

## Cenários

### Cenário 1: Atualizar ideia própria com sucesso
**Dado** que um usuário autenticado está logado
**E** existe uma ideia com ID "idea-123" criada pelo usuário
**Quando** o usuário faz uma requisição PUT para "/v1/ideas/idea-123"
**E** envia dados válidos no corpo da requisição:
```json
{
  "title": "Título Atualizado",
  "description": "Descrição atualizada da ideia"
}
```
**Então** o sistema deve retornar status 200
**E** deve retornar os dados atualizados da ideia
**E** deve atualizar a data de modificação

### Cenário 2: Tentar atualizar ideia de outro usuário
**Dado** que um usuário autenticado está logado
**E** existe uma ideia com ID "idea-123" criada por outro usuário
**Quando** o usuário faz uma requisição PUT para "/v1/ideas/idea-123"
**Então** o sistema deve retornar status 403
**E** deve retornar a mensagem "FORBIDDEN"

### Cenário 3: Atualizar ideia inexistente
**Dado** que um usuário autenticado está logado
**E** não existe uma ideia com ID "idea-inexistente" no sistema
**Quando** o usuário faz uma requisição PUT para "/v1/ideas/idea-inexistente"
**Então** o sistema deve retornar status 404
**E** deve retornar a mensagem "IDEA_NOT_FOUND"

### Cenário 4: Atualizar ideia sem autenticação
**Dado** que um usuário não está autenticado
**Quando** o usuário faz uma requisição PUT para "/v1/ideas/idea-123"
**Então** o sistema deve retornar status 401
**E** deve retornar a mensagem "UNAUTHORIZED"

### Cenário 5: Atualizar apenas título
**Dado** que um usuário autenticado está logado
**E** existe uma ideia com ID "idea-123" criada pelo usuário
**Quando** o usuário faz uma requisição PUT para "/v1/ideas/idea-123"
**E** envia apenas o título atualizado:
```json
{
  "title": "Novo Título"
}
```
**Então** o sistema deve retornar status 200
**E** deve atualizar apenas o título
**E** deve manter a descrição original

### Cenário 6: Erro interno do servidor
**Dado** que um usuário autenticado está logado
**E** existe uma ideia com ID "idea-123" criada pelo usuário
**E** ocorre um erro interno no sistema
**Quando** o usuário faz uma requisição PUT para "/v1/ideas/idea-123"
**Então** o sistema deve retornar status 500
**E** deve retornar a mensagem "Failed to update idea"

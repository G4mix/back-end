# Deletar Ideia

## Funcionalidade
Permite deletar uma ideia existente. Apenas o autor da ideia pode deletá-la. Esta ação é irreversível.

## Cenários

### Cenário 1: Deletar ideia própria com sucesso
**Dado** que um usuário autenticado está logado
**E** existe uma ideia com ID "idea-123" criada pelo usuário
**Quando** o usuário faz uma requisição DELETE para "/api/v1/ideas/idea-123"
**Então** o sistema deve retornar status 200
**E** deve retornar a mensagem "Idea deleted successfully"
**E** deve remover a ideia do banco de dados

### Cenário 2: Tentar deletar ideia de outro usuário
**Dado** que um usuário autenticado está logado
**E** existe uma ideia com ID "idea-123" criada por outro usuário
**Quando** o usuário faz uma requisição DELETE para "/api/v1/ideas/idea-123"
**Então** o sistema deve retornar status 403
**E** deve retornar a mensagem "FORBIDDEN"
**E** não deve deletar a ideia

### Cenário 3: Deletar ideia inexistente
**Dado** que um usuário autenticado está logado
**E** não existe uma ideia com ID "idea-inexistente" no sistema
**Quando** o usuário faz uma requisição DELETE para "/api/v1/ideas/idea-inexistente"
**Então** o sistema deve retornar status 404
**E** deve retornar a mensagem "IDEA_NOT_FOUND"

### Cenário 4: Deletar ideia sem autenticação
**Dado** que um usuário não está autenticado
**Quando** o usuário faz uma requisição DELETE para "/api/v1/ideas/idea-123"
**Então** o sistema deve retornar status 401
**E** deve retornar a mensagem "UNAUTHORIZED"

### Cenário 5: Erro interno do servidor
**Dado** que um usuário autenticado está logado
**E** existe uma ideia com ID "idea-123" criada pelo usuário
**E** ocorre um erro interno no sistema
**Quando** o usuário faz uma requisição DELETE para "/api/v1/ideas/idea-123"
**Então** o sistema deve retornar status 500
**E** deve retornar a mensagem "Failed to delete idea"

### Cenário 6: Deletar ideia com comentários e likes
**Dado** que um usuário autenticado está logado
**E** existe uma ideia com ID "idea-123" criada pelo usuário
**E** a ideia possui comentários e likes associados
**Quando** o usuário faz uma requisição DELETE para "/api/v1/ideas/idea-123"
**Então** o sistema deve retornar status 200
**E** deve retornar a mensagem "Idea deleted successfully"
**E** deve deletar a ideia e todos os dados relacionados (cascade)

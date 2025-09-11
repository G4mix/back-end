# Buscar Ideia por ID

## Funcionalidade
Permite buscar uma ideia específica pelo seu ID único.

## Cenários

### Cenário 1: Buscar ideia existente com sucesso
**Dado** que um usuário autenticado está logado
**E** existe uma ideia com ID "idea-123" no sistema
**Quando** o usuário faz uma requisição GET para "/v1/ideas/idea-123"
**Então** o sistema deve retornar status 200
**E** deve retornar os dados completos da ideia incluindo:
- ID da ideia
- Título
- Descrição
- ID do autor
- Informações do autor (nome, ícone)
- Data de criação
- Data de atualização
- Contadores (likes, visualizações, comentários)

### Cenário 2: Buscar ideia inexistente
**Dado** que um usuário autenticado está logado
**E** não existe uma ideia com ID "idea-inexistente" no sistema
**Quando** o usuário faz uma requisição GET para "/v1/ideas/idea-inexistente"
**Então** o sistema deve retornar status 404
**E** deve retornar a mensagem "IDEA_NOT_FOUND"

### Cenário 3: Buscar ideia sem autenticação
**Dado** que um usuário não está autenticado
**Quando** o usuário faz uma requisição GET para "/v1/ideas/idea-123"
**Então** o sistema deve retornar status 401
**E** deve retornar a mensagem "UNAUTHORIZED"

### Cenário 4: Erro interno do servidor
**Dado** que um usuário autenticado está logado
**E** ocorre um erro interno no sistema
**Quando** o usuário faz uma requisição GET para "/v1/ideas/idea-123"
**Então** o sistema deve retornar status 500
**E** deve retornar a mensagem "Failed to retrieve idea"

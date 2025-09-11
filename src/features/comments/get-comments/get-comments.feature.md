# Buscar Comentários

## Funcionalidade
Permite buscar comentários de uma ideia específica com paginação e filtros.

## Cenários

### Cenário 1: Buscar comentários de uma ideia com sucesso
**Dado** que um usuário autenticado está logado
**E** existe uma ideia com ID "idea-123" no sistema
**E** a ideia possui comentários
**Quando** o usuário faz uma requisição GET para "/v1/comments?ideaId=idea-123"
**Então** o sistema deve retornar status 200
**E** deve retornar uma lista paginada de comentários incluindo:
- ID do comentário
- Conteúdo do comentário
- ID da ideia
- ID do comentário pai (se for resposta)
- ID do autor
- Informações do autor (nome, ícone)
- Data de criação
- Data de atualização
- Contadores (likes, respostas)

### Cenário 2: Buscar comentários com paginação
**Dado** que um usuário autenticado está logado
**E** existe uma ideia com ID "idea-123" no sistema
**E** a ideia possui mais de 10 comentários
**Quando** o usuário faz uma requisição GET para "/v1/comments?ideaId=idea-123&page=2&limit=5"
**Então** o sistema deve retornar status 200
**E** deve retornar os comentários da página 2
**E** deve incluir informações de paginação:
- Página atual
- Limite por página
- Total de comentários
- Total de páginas
- Indicadores de próxima/anterior página

### Cenário 3: Buscar respostas de um comentário específico
**Dado** que um usuário autenticado está logado
**E** existe uma ideia com ID "idea-123" no sistema
**E** existe um comentário com ID "comment-456" que possui respostas
**Quando** o usuário faz uma requisição GET para "/v1/comments?ideaId=idea-123&parentCommentId=comment-456"
**Então** o sistema deve retornar status 200
**E** deve retornar apenas as respostas do comentário especificado

### Cenário 4: Buscar comentários de ideia sem comentários
**Dado** que um usuário autenticado está logado
**E** existe uma ideia com ID "idea-123" no sistema
**E** a ideia não possui comentários
**Quando** o usuário faz uma requisição GET para "/v1/comments?ideaId=idea-123"
**Então** o sistema deve retornar status 200
**E** deve retornar uma lista vazia de comentários
**E** deve incluir informações de paginação com total 0

### Cenário 5: Buscar comentários sem autenticação
**Dado** que um usuário não está autenticado
**Quando** o usuário faz uma requisição GET para "/v1/comments?ideaId=idea-123"
**Então** o sistema deve retornar status 401
**E** deve retornar a mensagem "UNAUTHORIZED"

### Cenário 6: Buscar comentários com parâmetros inválidos
**Dado** que um usuário autenticado está logado
**Quando** o usuário faz uma requisição GET para "/v1/comments?ideaId=idea-123&page=0&limit=200"
**Então** o sistema deve retornar status 200
**E** deve usar valores padrão (page=1, limit=10)
**E** deve limitar o máximo de itens por página

### Cenário 7: Erro interno do servidor
**Dado** que um usuário autenticado está logado
**E** ocorre um erro interno no sistema
**Quando** o usuário faz uma requisição GET para "/v1/comments?ideaId=idea-123"
**Então** o sistema deve retornar status 500
**E** deve retornar a mensagem "Failed to retrieve comments"

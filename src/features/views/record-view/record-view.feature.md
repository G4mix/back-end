# Funcionalidade: Registrar Visualizações em Lote

## Visão Geral
Permite que usuários autenticados registrem múltiplas visualizações de ideias de uma só vez, otimizando o processo para casos onde muitos vídeos/ideias são visualizados em sequência. O sistema previne visualizações duplicadas e atualiza contadores automaticamente.

## Regras de Negócio
- Usuário deve estar autenticado
- Todas as ideias devem existir no sistema
- Suporta registro de múltiplas visualizações em uma única requisição
- Previne visualizações duplicadas do mesmo usuário
- Atualiza contadores de visualização automaticamente
- Otimizado para casos de alta frequência de visualizações

## Cenários

### Cenário: Registrar visualização de uma única ideia
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com id "idea-123"
Quando envio uma requisição POST para "/v1/views/record" com:
  | Campo | Valor |
  | ideas | ["idea-123"] |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | viewed | boolean |
  | viewCount | number |
  | message | string |
E viewed deve ser true
E viewCount deve ser incrementado
E message deve ser "View recorded successfully"
```

### Cenário: Registrar visualizações de múltiplas ideias
```gherkin
Dado que estou autenticado como usuário
E existem ideias com ids "idea-123", "idea-456", "idea-789"
Quando envio uma requisição POST para "/v1/views/record" com:
  | Campo | Valor |
  | ideas | ["idea-123", "idea-456", "idea-789"] |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | viewed | boolean |
  | viewCount | number |
  | message | string |
E viewed deve ser true
E viewCount deve ser incrementado para todas as ideias
E message deve ser "View recorded successfully"
```

### Cenário: Registrar visualizações de muitas ideias (otimização)
```gherkin
Dado que estou autenticado como usuário
E existem 50 ideias com ids "idea-1" até "idea-50"
Quando envio uma requisição POST para "/v1/views/record" com:
  | Campo | Valor |
  | ideas | ["idea-1", "idea-2", ..., "idea-50"] |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | viewed | boolean |
  | viewCount | number |
  | message | string |
E viewed deve ser true
E todas as 50 visualizações devem ser registradas
E message deve ser "View recorded successfully"
```

### Cenário: Registrar visualizações com ideia inexistente
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com id "idea-123"
E não existe uma ideia com id "idea-inexistente"
Quando envio uma requisição POST para "/v1/views/record" com:
  | Campo | Valor |
  | ideas | ["idea-123", "idea-inexistente"] |
Então devo receber uma resposta 404 com erro "IDEA_NOT_FOUND"
```

### Cenário: Registrar visualizações sem autenticação
```gherkin
Dado que não estou autenticado
Quando envio uma requisição POST para "/v1/views/record" com:
  | Campo | Valor |
  | ideas | ["idea-123"] |
Então devo receber uma resposta 401 com erro "UNAUTHORIZED"
```

### Cenário: Registrar visualizações com array vazio
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição POST para "/v1/views/record" com:
  | Campo | Valor |
  | ideas | [] |
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Registrar visualizações sem campo ideas
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição POST para "/v1/views/record" com:
  | Campo | Valor |
  | {} | {} |
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Registrar visualizações com ideias duplicadas
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com id "idea-123"
Quando envio uma requisição POST para "/v1/views/record" com:
  | Campo | Valor |
  | ideas | ["idea-123", "idea-123", "idea-123"] |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | viewed | boolean |
  | viewCount | number |
  | message | string |
E viewed deve ser true
E apenas uma visualização deve ser registrada (duplicatas ignoradas)
E message deve ser "View recorded successfully"
```

### Cenário: Registrar visualizações com IDs inválidos
```gherkin
Dado que estou autenticado como usuário
Quando envio uma requisição POST para "/v1/views/record" com:
  | Campo | Valor |
  | ideas | ["", "invalid-id", "123"] |
Então devo receber uma resposta 400 com erro de validação
```

### Cenário: Registrar visualizações com array muito grande
```gherkin
Dado que estou autenticado como usuário
E existem 1000 ideias com ids "idea-1" até "idea-1000"
Quando envio uma requisição POST para "/v1/views/record" com:
  | Campo | Valor |
  | ideas | ["idea-1", "idea-2", ..., "idea-1000"] |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | viewed | boolean |
  | viewCount | number |
  | message | string |
E viewed deve ser true
E todas as 1000 visualizações devem ser registradas
E message deve ser "View recorded successfully"
```

### Cenário: Erro interno do servidor
```gherkin
Dado que estou autenticado como usuário
E existe uma ideia com id "idea-123"
E o banco de dados está indisponível
Quando envio uma requisição POST para "/v1/views/record" com:
  | Campo | Valor |
  | ideas | ["idea-123"] |
Então devo receber uma resposta 500 com erro "DATABASE_ERROR"
```

## Formato de Resposta

### Sucesso no Registro de Visualizações (200)
```json
{
  "viewed": true,
  "viewCount": 125,
  "message": "View recorded successfully"
}
```

### Respostas de Erro
- **400**: Erros de validação (array vazio, IDs inválidos, campos obrigatórios)
- **401**: `UNAUTHORIZED` (usuário não autenticado)
- **404**: `IDEA_NOT_FOUND` (alguma ideia não existe)
- **500**: `DATABASE_ERROR` (erro interno do servidor)

## Estrutura de Dados

### Campos de Entrada
- **ideas** (obrigatório): Array de IDs das ideias para registrar visualizações

### Campos de Resposta
- **viewed**: Status da operação (true = visualizações registradas)
- **viewCount**: Número total de visualizações da primeira ideia
- **message**: Mensagem descritiva da operação

## Otimizações para Alta Frequência

### Processamento em Lote
- Todas as visualizações são processadas em uma única transação
- Reduz overhead de múltiplas requisições HTTP
- Melhora performance para casos de uso intensivo

### Prevenção de Duplicatas
- Sistema automaticamente ignora visualizações duplicadas
- Baseado em usuário + ideia + timestamp
- Evita inflação artificial de contadores

### Validação Eficiente
- Validação de existência das ideias em lote
- Falha rápida se alguma ideia não existir
- Retorna erro específico para debugging

## Casos de Uso Típicos

### Navegação em Feed
- Usuário navega por feed de ideias
- Registra visualizações de múltiplas ideias
- Envia lote de visualizações periodicamente

### Visualização de Playlist
- Usuário assiste sequência de vídeos
- Registra visualizações de todas as ideias
- Otimiza para evitar muitas requisições

### Análise de Engajamento
- Sistema coleta métricas de visualização
- Dados são usados para ranking e recomendações
- Contadores são atualizados em tempo real

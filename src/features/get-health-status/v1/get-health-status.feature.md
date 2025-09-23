# Feature: Get Health Status

## Descrição
Endpoint para verificar o status de saúde da aplicação Gamix. Retorna informações básicas sobre o estado do serviço.

## Endpoint
`GET /v1/health`

## Response
```json
{
  "status": "ok"
}
```

## Regras de Negócio
- **Endpoint público** (não requer autenticação)
- **Resposta simples** com status da aplicação
- **Verificação básica** de funcionamento
- **Logging** de tempo de resposta

## Validações
- **Nenhuma validação** específica necessária
- **Endpoint sempre disponível** quando a aplicação está rodando

## Tratamento de Erros
- **200**: Sempre retorna sucesso quando a aplicação está funcionando
- **500**: Apenas em caso de falha crítica da aplicação

## Segurança
- **Endpoint público** sem restrições
- **Sem dados sensíveis** na resposta
- **Apenas status** básico da aplicação

## Dependências
- **Nenhuma dependência** externa
- **Aplicação NestJS** funcionando
- **Logging decorator** para monitoramento

## Casos de Uso
- **Health check** de load balancers
- **Monitoramento** de aplicação
- **Verificação** de disponibilidade
- **CI/CD** pipelines
- **Kubernetes** liveness/readiness probes

## Monitoramento
- **Tempo de resposta** registrado
- **Logs** de acesso ao endpoint
- **Métricas** de disponibilidade
- **Alertas** em caso de falha

## Integração
- **Load balancers** podem usar para health checks
- **Orquestradores** podem verificar disponibilidade
- **Monitoramento** externo pode consultar
- **CI/CD** pode verificar antes de deploy

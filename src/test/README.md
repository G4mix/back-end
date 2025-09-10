# Testes de Integração

Este diretório contém os testes de integração que fazem requests HTTP reais para o servidor.

## Estrutura

```
src/test/
├── setup/
│   ├── integration-test-setup.ts    # Setup do servidor para testes
│   └── jest.setup.ts                # Configuração global do Jest
├── helpers/
│   ├── http-client.ts               # Cliente HTTP para fazer requests
│   └── test-data.ts                 # Dados de teste reutilizáveis
├── integration/
│   ├── auth.integration.spec.ts     # Testes de autenticação
│   ├── ideas.integration.spec.ts    # Testes de ideas
│   ├── comments.integration.spec.ts # Testes de comentários
│   └── user-management.integration.spec.ts # Testes de gerenciamento de usuário
└── README.md                        # Este arquivo
```

## Como Executar

### Todos os testes de integração
```bash
npm run test:integration
```

### Todos os testes (unitários + integração)
```bash
npm run test:all
```

### Teste específico
```bash
npm run test:integration -- --testNamePattern="Auth Integration Tests"
```

## Características

### ✅ **Requests HTTP Reais**
- Usa axios para fazer requests HTTP reais
- Testa o servidor completo (middleware, validação, rotas)
- Simula comportamento real do cliente

### ✅ **Servidor Automático**
- Inicia servidor real em porta dinâmica
- Evita conflitos de porta automaticamente
- Para servidor após os testes

### ✅ **Mocks Inteligentes**
- Mocka apenas dependências externas (banco, AWS, SES)
- Mantém lógica de negócio real
- Testa validação e serialização reais

### ✅ **Validação Automática**
- Testa validação de entrada real
- Verifica códigos de status HTTP corretos
- Valida estrutura de resposta

## Exemplo de Uso

```typescript
import { IntegrationTestSetup } from '../setup/integration-test-setup'
import { HttpClient } from '../helpers/http-client'
import { TestData } from '../helpers/test-data'

describe('Meu Teste de Integração', () => {
  let httpClient: HttpClient
  let baseUrl: string

  beforeAll(async () => {
    // Inicia servidor
    baseUrl = await IntegrationTestSetup.startServer()
    httpClient = new HttpClient(baseUrl)
  })

  afterAll(async () => {
    // Para servidor
    await IntegrationTestSetup.stopServer()
  })

  it('should create user successfully', async () => {
    // Arrange
    const userData = TestData.createUser()
    
    // Mock do banco
    IntegrationTestSetup.setupMocks({
      prisma: {
        user: {
          create: jest.fn().mockResolvedValue({ id: '123', ...userData })
        }
      }
    })

    // Act
    const response = await httpClient.post('/api/v1/auth/signup', userData)

    // Assert
    expect(response.status).toBe(201)
    expect(response.data).toHaveProperty('accessToken')
  })
})
```

## Vantagens

1. **Testes Reais**: Testa o comportamento real da aplicação
2. **Validação Completa**: Testa middleware de validação automática
3. **Sem Conflitos**: Porta dinâmica evita conflitos
4. **Mocks Mínimos**: Mocka apenas o necessário
5. **Fácil Manutenção**: Estrutura organizada e reutilizável
6. **Cobertura Completa**: Testa toda a stack (HTTP → Controller → Service → Repository)

## Configuração

Os testes usam a configuração `jest.integration.config.js` que:
- Executa apenas arquivos `*.integration.spec.ts`
- Usa timeout de 30 segundos
- Executa um teste por vez (evita conflitos)
- Gera relatório de cobertura específico

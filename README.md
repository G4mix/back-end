# Back-end Gamix

Bem-vindo ao repositório do Back-end da plataforma Gamix! Este repositório contém o código-fonte e as lógicas essenciais para a autenticação, gerenciamento de usuários, funcionalidades sociais e outras funcionalidades do servidor da plataforma Gamix.

## Sobre a Plataforma Gamix

A plataforma Gamix é uma comunidade que une amantes de jogos, desenvolvedores e entusiastas para criar projetos inovadores na área de jogos. Este repositório contém a implementação do Back-end da plataforma, que é responsável por gerenciar a autenticação dos usuários, perfis de usuário, funcionalidades sociais (seguir/parar de seguir), comunicação com o banco de dados e muito mais.

## Tecnologias Utilizadas

- **Framework**: NestJS
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL
- **ORM**: TypeORM
- **Autenticação**: JWT (JSON Web Token) com refresh tokens
- **Email**: AWS SES
- **Storage**: AWS S3
- **Deploy**: Vercel
- **Testes**: Jest com E2E testing
- **Containerização**: Docker

## Arquitetura

O projeto segue uma arquitetura baseada em features, organizando o código de forma modular e escalável:

```
src/
├── entities/                     # Entidades do banco de dados
├── features/                     # Features organizadas por funcionalidade
│   ├── auth/                     # Autenticação (signin, signup, refresh-token)
│   ├── user-management/          # Gerenciamento de usuários
│   └── get-health-status/       # Health check
├── jwt/                          # Configurações JWT
├── shared/                       # Código compartilhado
└── test/                         # Infraestrutura de testes
```

## Funcionalidades

### Autenticação
- **Sign In**: Login com email e senha
- **Sign Up**: Registro de novos usuários
- **Refresh Token**: Renovação segura de tokens
- **Proteção de Rotas**: Sistema de guards e estratégias JWT

### Gerenciamento de Usuários
- **Listar Usuários**: Busca e listagem de usuários
- **Perfil do Usuário**: Visualização e edição de perfis
- **Atualização de Dados**: Edição de informações do usuário
- **Exclusão de Conta**: Remoção de usuários
- **Sistema de Seguir**: Funcionalidade de seguir/parar de seguir usuários

### Infraestrutura
- **Health Check**: Monitoramento da saúde da aplicação
- **Integração AWS**: S3 para storage e SES para emails
- **Sistema de Erros**: Tratamento padronizado de erros
- **Validação**: Validação robusta de dados de entrada

## Como Executar

### Pré-requisitos
- Node.js 18+
- PostgreSQL
- Docker (opcional)

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/gamix-backend.git
cd gamix-backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp env.example .env
# Edite o arquivo .env com suas configurações
```

4. Execute o banco de dados:
```bash
docker-compose up -d
```

5. Execute a aplicação:
```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

### Testes

```bash
# Executar todos os testes
npm test

# Executar testes com coverage
npm run test:cov

# Executar testes em modo watch
npm run test:watch
```

## Documentação

- [Diretrizes de Desenvolvimento](docs/guidelines.md) - Guia completo de desenvolvimento
- [Features](src/features/) - Documentação de cada feature
- [API Documentation](src/features/*/v1/*.feature.md) - Documentação da API

## Scripts Disponíveis

- `npm run build` - Compila o projeto
- `npm run start` - Inicia a aplicação
- `npm run start:dev` - Inicia em modo desenvolvimento
- `npm run start:debug` - Inicia em modo debug
- `npm run start:prod` - Inicia em modo produção
- `npm run test` - Executa os testes
- `npm run test:cov` - Executa testes com coverage
- `npm run lint` - Executa o linter
- `npm run format` - Formata o código

## Contribuição

Para contribuir com o projeto, siga as diretrizes estabelecidas em [docs/guidelines.md](docs/guidelines.md).

## Contato

Para dúvidas ou sugestões relacionadas ao Back-end Gamix, entre em contato com o time de desenvolvimento responsável:

- [Gabriel Vicente - Sênior Back-end](https://github.com/gabrielOliv1)
- [Lucas Christian - Engenheiro de Software](https://github.com/Lucas-Christian)

Agradecemos por ser parte da comunidade Gamix e por contribuir para a construção de projetos de jogos emocionantes!

---

© 2024 Gamix. Todos os direitos reservados.

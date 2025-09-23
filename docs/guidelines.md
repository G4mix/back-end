# Diretrizes de Desenvolvimento - Gamix Backend

Este documento define as diretrizes de desenvolvimento para o backend da plataforma Gamix, uma comunidade que une amantes de jogos, desenvolvedores e entusiastas para criar projetos inovadores na área de jogos.

## 1. Visão Geral da Arquitetura

O backend do Gamix é construído com NestJS e segue uma arquitetura simples e organizada baseada em features, com foco na simplicidade e manutenibilidade.

### Tecnologias Utilizadas
- **Framework**: NestJS
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT (JSON Web Token)
- **ORM**: TypeORM
- **Email**: AWS SES
- **Deploy**: Vercel

## 2. Estrutura do Projeto

### 2.1. Estrutura de Diretórios

```
src/
├── entities/                     # Entidades do banco de dados
│   ├── user.entity.ts
│   ├── user-code.entity.ts
│   ├── user-oauth.entity.ts
│   ├── user-profile.entity.ts
│   ├── follow.entity.ts
│   └── link.entity.ts
├── features/                     # Features organizadas por funcionalidade
│   ├── auth/                     # Autenticação
│   │   ├── signin/v1/
│   │   ├── signup/v1/
│   │   └── refresh-token/v1/
│   ├── user-management/          # Gerenciamento de usuários
│   │   ├── get-all-users/v1/
│   │   ├── get-user-by-id/v1/
│   │   └── delete-user/v1/
│   └── get-health-status/v1/    # Health check
├── jwt/                          # Configurações JWT
│   ├── auth.guard.ts
│   ├── jwt.strategy.ts
│   └── constants.ts
├── shared/                       # Código compartilhado
│   ├── decorators/
│   │   ├── log-response-time.decorator.ts
│   │   └── protected.decorator.ts
│   ├── gateways/
│   │   └── ses.gateway.ts
│   ├── utils/
│   └── errors.ts
├── app.module.ts
├── main.ts
└── setup-application.ts
```

### 2.2. Padrão de Features

Cada feature segue a estrutura:

```
src/features/[feature-name]/[subfeature]/v[version]/
├── [name].controller.ts
├── [name].dto.ts
├── [name].spec.ts
└── [name].feature.md
```

**Exemplo:**
```
src/features/auth/signin/v1/
├── signin.controller.ts
├── signin.dto.ts
├── signin.spec.ts
└── signin.feature.md
```

## 3. Padrões de Desenvolvimento

### 3.1. Imports

**Regra Obrigatória:** Sempre usar imports absolutos começando com `src/`

```typescript
// ✅ CORRETO
import { User } from 'src/entities/user.entity';
import { LogResponseTime } from 'src/shared/decorators/log-response-time.decorator';
import { Protected } from 'src/shared/decorators/protected.decorator';

// ❌ INCORRETO
import { User } from '../../../entities/user.entity';
import { LogResponseTime } from '../../../../shared/decorators/log-response-time.decorator';
```

### 3.2. Controllers

**Responsabilidades:**
- Receber requisições HTTP
- Validar dados de entrada
- Executar lógica de negócio
- Retornar respostas padronizadas
- Implementar logging automático

**Exemplo de Controller:**

```typescript
// src/features/auth/signin/v1/signin.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Version,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { SigninInput, SigninOutput } from './signin.dto';
import { LogResponseTime } from 'src/shared/decorators/log-response-time.decorator';

@Controller('/auth')
export class SignInController {
  readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Post('/signin')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @LogResponseTime()
  async signin(@Body() body: SigninInput): Promise<SigninOutput> {
    // Lógica de autenticação
  }
}
```

### 3.3. DTOs

**Responsabilidades:**
- Validação de dados de entrada
- Transformação de dados
- Documentação da API

**Exemplo de DTO:**

```typescript
// src/features/auth/signin/v1/signin.dto.ts
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SigninInput {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SigninOutput {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    verified: boolean;
  };
}
```

### 3.4. Entidades

**Responsabilidades:**
- Definir estrutura do banco de dados
- Relacionamentos entre entidades
- Métodos de transformação (toDto)

**Exemplo de Entidade:**

```typescript
// src/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserProfile } from './user-profile.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  username: string;

  @Column({ length: 320, unique: true })
  email: string;

  @Column({ length: 60 })
  password: string;

  @Column({ default: false })
  verified: boolean;

  @OneToOne(() => UserProfile, (profile) => profile.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_profile_id' })
  userProfile: UserProfile;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  toDto(currentUserId?: string): UserDto {
    const dto = new UserDto();
    dto.id = this.id;
    dto.username = this.username;
    dto.email = this.email;
    dto.verified = this.verified;
    dto.userProfile = this.userProfile?.toDto(currentUserId);
    return dto;
  }
}
```

## 4. Autenticação e Autorização

### 4.1. JWT Strategy

```typescript
// src/jwt/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface RequestWithUserData extends Request {
  user: {
    sub: string;
    userProfileId: string;
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SIGNING_KEY_SECRET,
    });
  }

  async validate(payload: any) {
    return {
      sub: payload.sub,
      userProfileId: payload.userProfileId,
    };
  }
}
```

### 4.2. Guards

```typescript
// src/jwt/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Lógica de verificação JWT
    return true;
  }
}
```

### 4.3. Decorators

```typescript
// src/shared/decorators/protected.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const Protected = () => SetMetadata('isProtected', true);
```

## 5. Tratamento de Erros

### 5.1. Exceções Customizadas

```typescript
// src/shared/errors.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class UserNotFound extends HttpException {
  constructor() {
    super(
      {
        message: 'User not found',
        error: 'Not Found',
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class TooManyLoginAttempts extends HttpException {
  constructor() {
    super(
      {
        message: 'Too many login attempts. Account temporarily blocked.',
        error: 'Too Many Requests',
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
```

## 6. Logging e Observabilidade

### 6.1. Decorator de Logging

```typescript
// src/shared/decorators/log-response-time.decorator.ts
import { Logger } from '@nestjs/common';

export function LogResponseTime() {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as (
      ...args: unknown[]
    ) => Promise<unknown>;
    const logger = new Logger(target.constructor.name);

    descriptor.value = async function (
      this: any,
      ...args: unknown[]
    ) {
      const startTime = new Date().getTime();
      const params = args.length > 0 ? args[0] : {};
      
      logger.log(`Starting ${propertyKey}`, params);

      try {
        const result = (await originalMethod.apply(this, args)) as unknown;
        const responseTime = new Date().getTime() - startTime;
        
        logger.log(
          `Finished ${propertyKey}. Response time: ${responseTime}ms`,
        );
        
        return result;
      } catch (error) {
        const responseTime = new Date().getTime() - startTime;
        
        logger.error(
          `Error in ${propertyKey}. Response time: ${responseTime}ms`,
          error,
        );
        
        throw error;
      }
    };

    return descriptor;
  };
}
```

## 7. Testes

### 7.1. Configuração Jest

```typescript
// jest.config.ts
import { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.spec.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts',
    '!test/setup-application.ts',
  ],
  coverageDirectory: './coverage',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
```

### 7.2. Setup de Aplicação

```typescript
// test/setup-application.ts
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';

export function setupApplication(app: INestApplication): void {
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
}
```

### 7.3. Exemplo de Teste E2E

```typescript
// src/features/auth/signin/v1/signin.spec.ts
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { User } from 'src/entities/user.entity';
import { setupApplication } from 'test/setup-application';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { hashSync } from 'bcrypt';

describe('/v1/auth/signin (POST)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApplication(app);
    await app.init();

    userRepository = app.get('UserRepository');
    await userRepository.clear();
  });

  afterEach(async () => {
    const dataSource = app.get(DataSource);
    await dataSource.destroy();
    await app.close();
  });

  it('should return 200 and token when credentials are valid', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await userRepository.save({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      verified: true,
    });

    const response = await request(app.getHttpServer())
      .post('/v1/auth/signin')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    expect(response.status).toEqual(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.user).toBeDefined();
  });
});
```

## 8. Documentação de Features

### 8.1. Arquivo .feature.md

Cada feature deve ter um arquivo `.feature.md` documentando:

```markdown
# Feature: Sign In

## Descrição
Endpoint para autenticação de usuários na plataforma Gamix.

## Endpoint
`POST /v1/auth/signin`

## Request Body
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

## Response
```json
{
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "user": {
    "id": "uuid",
    "username": "username",
    "email": "user@example.com",
    "verified": true
  }
}
```

## Regras de Negócio
- Máximo 5 tentativas de login
- Bloqueio temporário após 5 tentativas
- Verificação de email obrigatória
- Senha deve ser hash bcrypt

## Testes
- ✅ Login com credenciais válidas
- ✅ Login com credenciais inválidas
- ✅ Bloqueio após muitas tentativas
- ✅ Validação de campos obrigatórios
```

## 9. Configuração de Ambiente

### 9.1. Variáveis de Ambiente

```bash
# .env
NODE_ENV=development
PORT=3000
PG_DB_URL=postgresql://user:password@localhost:5432/gamix_db
JWT_SIGNING_KEY_SECRET=your_secret_key
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### 9.2. Docker Compose

```yaml
# docker-compose.yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: gamix_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 10. Deploy

### 10.1. Vercel Configuration

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/main.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/main.js"
    }
  ]
}
```

## 11. Boas Práticas

### 11.1. Código
- ✅ Sempre usar TypeScript
- ✅ Implementar logging em todas as operações
- ✅ Validar dados de entrada
- ✅ Tratar erros adequadamente
- ✅ Escrever testes para todas as features
- ✅ Documentar cada feature com .feature.md

### 11.2. Segurança
- ✅ Hash de senhas com bcrypt
- ✅ Validação de JWT tokens
- ✅ Rate limiting para endpoints sensíveis
- ✅ Sanitização de dados de entrada
- ✅ Headers de segurança

### 11.3. Performance
- ✅ Paginação em listagens
- ✅ Índices no banco de dados
- ✅ Logging de tempo de resposta
- ✅ Otimização de queries

## 12. Considerações Finais

- **Simplicidade**: Manter a arquitetura simples e compreensível
- **Testes**: Escrever testes abrangentes para todas as funcionalidades
- **Documentação**: Manter documentação atualizada
- **Segurança**: Implementar práticas de segurança adequadas
- **Performance**: Monitorar e otimizar performance
- **Manutenibilidade**: Código limpo e bem estruturado

Ao seguir estas diretrizes, os desenvolvedores podem contribuir de forma consistente e eficiente para o backend da plataforma Gamix.
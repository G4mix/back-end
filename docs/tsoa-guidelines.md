# Diretrizes de Criação de Código para Agentes LLM - TSOA

Este documento serve como um guia detalhado para Agentes de LLM que precisam criar ou modificar código neste projeto TSOA. Ele descreve a estrutura esperada das features, as responsabilidades de cada componente e as diretrizes de implementação, utilizando exemplos do código existente para ilustrar os conceitos.

## 1. Visão Geral da Estrutura de Features

As features são organizadas de forma modular, seguindo um padrão consistente para facilitar a manutenção, escalabilidade e versionamento.

### Organização de Pastas

Cada feature deve residir em uma estrutura de diretórios que segue o padrão:
`src/features/nome-da-feature/nome-da-subfeature/`

- `nome-da-feature`: Representa uma funcionalidade principal (ex: `user-management`, `auth`).
- `nome-da-subfeature`: Representa uma operação específica dentro da funcionalidade principal (ex: `create-user`, `update-user`, `signin`).
- **Nota**: Pastas `vX` são opcionais e devem ser criadas apenas quando necessário para versionamento futuro.

**Exemplo de estrutura atual:**

```
src/
├── features/
│   ├── user-management/
│   │   ├── create-user/
│   │   │   ├── create-user.controller.ts
│   │   │   ├── create-user.dto.ts
│   │   │   ├── create-user.spec.ts
│   │   │   └── create-user.feature.md
│   │   ├── update-user/
│   │   │   ├── update-user.controller.ts
│   │   │   ├── update-user.dto.ts
│   │   │   ├── update-user.spec.ts
│   │   │   └── update-user.feature.md
│   │   ├── get-users/
│   │   │   ├── get-users.controller.ts
│   │   │   ├── get-users.dto.ts
│   │   │   ├── get-users.spec.ts
│   │   │   └── get-users.feature.md
│   │   ├── get-user-by-id/
│   │   │   ├── get-user-by-id.controller.ts
│   │   │   ├── get-user-by-id.dto.ts
│   │   │   ├── get-user-by-id.spec.ts
│   │   │   └── get-user-by-id.feature.md
│   │   └── delete-user/
│   │       ├── delete-user.controller.ts
│   │       ├── delete-user.dto.ts
│   │       ├── delete-user.spec.ts
│   │       └── delete-user.feature.md
│   ├── auth/
│   │   ├── signin/
│   │   │   ├── signin.controller.ts
│   │   │   ├── signin.dto.ts
│   │   │   ├── signin.spec.ts
│   │   │   └── signin.feature.md
│   │   ├── signup/
│   │   │   ├── signup.controller.ts
│   │   │   ├── signup.dto.ts
│   │   │   ├── signup.spec.ts
│   │   │   └── signup.feature.md
│   │   ├── change-password/
│   │   │   ├── change-password.controller.ts
│   │   │   ├── change-password.dto.ts
│   │   │   ├── change-password.spec.ts
│   │   │   └── change-password.feature.md
│   │   ├── recover-email/
│   │   │   ├── recover-email.controller.ts
│   │   │   ├── recover-email.dto.ts
│   │   │   ├── recover-email.spec.ts
│   │   │   └── recover-email.feature.md
│   │   ├── refresh-token/
│   │   │   ├── refresh-token.controller.ts
│   │   │   ├── refresh-token.dto.ts
│   │   │   ├── refresh-token.spec.ts
│   │   │   └── refresh-token.feature.md
│   │   └── social-login/
│   │       ├── social-login.controller.ts
│   │       ├── social-login.dto.ts
│   │       ├── social-login.spec.ts
│   │       └── social-login.feature.md
│   │           ├── signup.controller.ts
│   │           ├── signup.dto.ts
│   │           ├── signup.spec.ts
│   │           └── signup.feature.md
│   └── post-management/
│       ├── create-post/
│       │   └── v1/
│       │       ├── create-post.controller.ts
│       │       ├── create-post.dto.ts
│       │       ├── create-post.spec.ts
│       │       └── create-post.feature.md
│       └── get-posts/
│           └── v1/
│               ├── get-posts.controller.ts
│               ├── get-posts.dto.ts
│               ├── get-posts.spec.ts
│               └── get-posts.feature.md
├── shared/
│   ├── gateways/                    # Gateway pattern para integrações externas
│   │   ├── user.gateway.ts
│   │   ├── auth.gateway.ts
│   │   └── post.gateway.ts
│   ├── repositories/                # Repositórios compartilhados
│   │   ├── user.repository.ts
│   │   ├── auth.repository.ts
│   │   └── post.repository.ts
│   ├── schemas/                     # Schemas compartilhados
│   │   ├── user.schema.ts
│   │   ├── auth.schema.ts
│   │   └── post.schema.ts
│   ├── types/                       # Tipos compartilhados
│   │   ├── user.d.ts
│   │   ├── auth.d.ts
│   │   └── post.d.ts
│   ├── serializers/                 # Serializers compartilhados
│   │   ├── user.serializer.ts
│   │   ├── auth.serializer.ts
│   │   └── post.serializer.ts
│   ├── middlewares/                 # Middlewares compartilhados
│   │   ├── validation.middleware.ts
│   │   ├── auth.middleware.ts
│   │   └── logging.middleware.ts
│   └── errors/                      # Erros customizados
│       ├── user.errors.ts
│       ├── auth.errors.ts
│       └── post.errors.ts
└── config/
    ├── tsoa.json
    ├── ioc.ts
    └── app.ts
```

### Arquivos Essenciais

Dentro de cada pasta de versão (`vX`), os seguintes tipos de arquivos são esperados:

- `Controller.ts`: Contém a lógica do controlador TSOA que lida com as requisições HTTP.
- `Dto.ts`: Define os Data Transfer Objects (DTOs) para validação e tipagem dos dados de entrada e saída.
- `E2e-spec.ts`: Contém os testes end-to-end para a funcionalidade.
- `Feature.md`: Documentação da feature em formato Markdown, descrevendo os cenários de uso.

## 2. Componentes da Feature e Suas Responsabilidades

### 2.1. Controller (`.controller.ts`)

O controlador é o ponto de entrada para as requisições HTTP e orquestra a lógica de negócios.

**Responsabilidades:**

- Receber requisições HTTP usando decoradores TSOA.
- Validar dados de entrada (delegando aos DTOs).
- Chamar gateways para executar operações externas.
- Chamar repositórios para operações de banco de dados.
- Retornar respostas HTTP apropriadas.
- Realizar logging das operações.

**Exemplo de `create-user.controller.ts`:**

```typescript
import { Route, Tags, Controller, Body, Post, SuccessResponse, Middlewares } from 'tsoa'
import { injectable } from 'tsyringe'
import { CreateUserInput, CreateUserOutput } from './create-user.dto'
import { UserGateway } from '@shared/gateways/user.gateway'
import { UserRepository } from '@shared/repositories/user.repository'
import { schemaValidation } from '@shared/middlewares/validation.middleware'
import { createUserSchema } from '@shared/schemas/user.schema'
import { RequestHandler } from 'express'

@injectable()
@Route('api/v1/users')
@Tags('User Management')
export class CreateUserController extends Controller {
	constructor(
		private userGateway: UserGateway,
		private userRepository: UserRepository
	) {
		super()
	}

	/**
	 * Create a new user in the system
	 */
	@SuccessResponse(201, 'User created successfully')
	@Post('/')
	@Middlewares<RequestHandler>(schemaValidation(createUserSchema))
	public async createUser(@Body() body: CreateUserInput): Promise<CreateUserOutput> {
		// Validação de negócio
		const existingUser = await this.userRepository.findByEmail({ email: body.email })
		if (existingUser) {
			throw new Error('USER_ALREADY_EXISTS')
		}

		// Verificação externa via gateway
		const emailVerification = await this.userGateway.verifyEmail({ email: body.email })
		if (!emailVerification.valid) {
			throw new Error('INVALID_EMAIL')
		}

		// Criação do usuário
		const user = await this.userRepository.create({
			username: body.username,
			email: body.email.toLowerCase(),
			password: body.password
		})

		// Envio de email de boas-vindas via gateway
		await this.userGateway.sendWelcomeEmail({ 
			email: user.email, 
			username: user.username 
		})

		return {
			id: user.id,
			username: user.username,
			email: user.email,
			createdAt: user.createdAt
		}
	}
}
```

**Pontos Chave:**

- **Decoradores TSOA**: `@Route`, `@Post`, `@SuccessResponse`, `@Tags` são usados para configurar o endpoint e seu comportamento.
- **Injeção de Dependências**: Gateways e repositórios são injetados no construtor usando `tsyringe` (`@injectable()`).
- **Validação de Dados**: Middlewares de validação (`@Middlewares`) são aplicados usando schemas Zod.
- **Documentação**: Comentários JSDoc são usados para documentar os endpoints.
- **Gateway Pattern**: Uso de gateways para integrações externas (verificação de email, envio de emails).
- **Repositórios**: Uso direto de repositórios para operações de banco de dados.

### 2.2. Gateway (`.gateway.ts`)

Os gateways encapsulam integrações com serviços externos e APIs de terceiros.

**Responsabilidades:**

- Abstrair integrações com serviços externos.
- Implementar retry logic e circuit breakers.
- Tratar erros de integração de forma consistente.
- Cachear respostas quando apropriado.
- Fornecer interfaces limpas para o domínio.

**Exemplo de `user.gateway.ts`:**

```typescript
import { injectable, singleton } from 'tsyringe'
import { SESService } from '@shared/gateways/ses.gateway'
import { EmailVerificationService } from '@shared/gateways/email-verification.gateway'

@injectable()
@singleton()
export class UserGateway {
	constructor(
		private sesService: SESService,
		private emailVerificationService: EmailVerificationService
	) {}

	async verifyEmail({ email }: { email: string }): Promise<{ valid: boolean; reason?: string }> {
		try {
			const result = await this.emailVerificationService.verify({ email })
			return { valid: result.isValid, reason: result.reason }
		} catch (error) {
			console.error('Email verification failed:', error)
			return { valid: false, reason: 'SERVICE_UNAVAILABLE' }
		}
	}

	async sendWelcomeEmail({ email, username }: { email: string; username: string }): Promise<void> {
		try {
			await this.sesService.sendEmail({
				template: 'welcome',
				to: email,
				data: { username }
			})
		} catch (error) {
			console.error('Welcome email failed:', error)
			// Não falha a operação principal se o email falhar
		}
	}

	async sendPasswordResetEmail({ email, token }: { email: string; token: string }): Promise<void> {
		try {
			await this.sesService.sendEmail({
				template: 'password-reset',
				to: email,
				data: { resetToken: token }
			})
		} catch (error) {
			console.error('Password reset email failed:', error)
			throw new Error('EMAIL_SEND_FAILED')
		}
	}

	async validateSocialLogin({ provider, token }: { provider: string; token: string }): Promise<{ valid: boolean; userData?: any }> {
		try {
			const userData = await this.getSocialUserData({ provider, token })
			return { valid: true, userData }
		} catch (error) {
			console.error('Social login validation failed:', error)
			return { valid: false }
		}
	}

	private async getSocialUserData({ provider, token }: { provider: string; token: string }) {
		// Implementação específica para cada provedor
		switch (provider) {
			case 'google':
				return await this.validateGoogleToken(token)
			case 'github':
				return await this.validateGithubToken(token)
			case 'linkedin':
				return await this.validateLinkedinToken(token)
			default:
				throw new Error('UNSUPPORTED_PROVIDER')
		}
	}

	private async validateGoogleToken(token: string) {
		// Implementação da validação do Google
		// ...
	}

	private async validateGithubToken(token: string) {
		// Implementação da validação do GitHub
		// ...
	}

	private async validateLinkedinToken(token: string) {
		// Implementação da validação do LinkedIn
		// ...
	}
}
```

**Pontos Chave:**

- **Abstração de Integrações**: Encapsula todas as integrações externas em uma interface limpa.
- **Tratamento de Erros**: Implementa retry logic e fallbacks apropriados.
- **Circuit Breaker**: Previne cascata de falhas quando serviços externos estão indisponíveis.
- **Cache**: Implementa cache quando apropriado para melhorar performance.
- **Injeção de Dependências**: Outros gateways são injetados para compor funcionalidades.

### 2.3. DTO (`.dto.ts`)

Os Data Transfer Objects (DTOs) são classes que definem a estrutura e as regras de validação para os dados que transitam entre as camadas da aplicação.

**Responsabilidades:**

- Definir a forma dos dados de entrada (payloads de requisição).
- Aplicar regras de validação usando schemas Zod.
- Realizar transformações de dados quando necessário.
- Garantir tipagem forte para entrada e saída.

**Exemplo de `create-user.dto.ts`:**

```typescript
import { z } from 'zod'

// Schema de validação
export const createUserSchema = z.object({
	username: z.string()
		.min(3, 'USERNAME_TOO_SHORT')
		.max(255, 'USERNAME_TOO_LONG')
		.regex(/^[a-zA-Z0-9_]+$/, 'INVALID_USERNAME_FORMAT'),
	email: z.string()
		.email('INVALID_EMAIL_FORMAT')
		.max(255, 'EMAIL_TOO_LONG'),
	password: z.string()
		.min(8, 'PASSWORD_TOO_SHORT')
		.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'INVALID_PASSWORD_FORMAT'),
	confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
	message: 'PASSWORDS_DO_NOT_MATCH',
	path: ['confirmPassword']
})

// Tipos TypeScript inferidos do schema
export type CreateUserInput = z.infer<typeof createUserSchema>

// DTO de saída
export interface CreateUserOutput {
	id: string
	username: string
	email: string
	createdAt: Date
}

// DTO para atualização
export const updateUserSchema = z.object({
	username: z.string()
		.min(3, 'USERNAME_TOO_SHORT')
		.max(255, 'USERNAME_TOO_LONG')
		.regex(/^[a-zA-Z0-9_]+$/, 'INVALID_USERNAME_FORMAT')
		.optional(),
	email: z.string()
		.email('INVALID_EMAIL_FORMAT')
		.max(255, 'EMAIL_TOO_LONG')
		.optional(),
	displayName: z.string()
		.max(255, 'DISPLAY_NAME_TOO_LONG')
		.optional(),
	autobiography: z.string()
		.max(1000, 'AUTOBIOGRAPHY_TOO_LONG')
		.optional()
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>

// DTO para busca
export const getUserSchema = z.object({
	id: z.string().uuid('INVALID_USER_ID')
})

export type GetUserInput = z.infer<typeof getUserSchema>
```

**Pontos Chave:**

- **Validação com Zod**: Uso de schemas Zod para validação robusta e mensagens de erro customizadas.
- **Inferência de Tipos**: Uso de `z.infer` para gerar tipos TypeScript automaticamente.
- **Validações Complexas**: Uso de `.refine()` para validações que dependem de múltiplos campos.
- **Transformações**: Zod permite transformações automáticas de dados (ex: `.toLowerCase()`).

### 2.4. Repository (`.repository.ts`)

Os repositórios contêm a lógica de acesso aos dados usando Prisma ORM.

**Responsabilidades:**

- Executar operações CRUD no banco de dados.
- Implementar consultas complexas com relacionamentos.
- Gerenciar transações quando necessário.
- Retornar dados no formato esperado pelos controllers.

**Exemplo de `user.repository.ts`:**

```typescript
import { inject, injectable, singleton } from 'tsyringe'
import { Prisma, PrismaClient } from '@prisma/client'
import { CreateUserInput, UpdateUserInput } from '@shared/types/user.d'

@injectable()
@singleton()
export class UserRepository {
	constructor(@inject('PostgresqlClient') private pg: PrismaClient) {}

	async create(data: CreateUserInput) {
		return this.pg.user.create({
			data: {
				username: data.username,
				email: data.email.toLowerCase(),
				password: data.password, // Já deve vir hasheado do controller
				userProfile: {
					create: {
						displayName: data.username
					}
				}
			},
			include: {
				userProfile: true
			}
		})
	}

	async findByEmail({ email }: { email: string }) {
		return this.pg.user.findUnique({
			where: { email: email.toLowerCase() },
			include: {
				userProfile: true
			}
		})
	}

	async findById({ id }: { id: string }) {
		return this.pg.user.findUnique({
			where: { id },
			include: {
				userProfile: true
			}
		})
	}

	async update({ id, ...data }: { id: string } & Partial<UpdateUserInput>) {
		return this.pg.user.update({
			where: { id },
			data: {
				...data,
				email: data.email?.toLowerCase(),
				userProfile: data.displayName || data.autobiography ? {
					update: {
						displayName: data.displayName,
						autobiography: data.autobiography
					}
				} : undefined
			},
			include: {
				userProfile: true
			}
		})
	}

	async delete({ id }: { id: string }) {
		return this.pg.user.delete({
			where: { id }
		})
	}

	async findAll({ 
		page, 
		limit, 
		search 
	}: { 
		page: number; 
		limit: number; 
		search?: string 
	}) {
		const where = search ? {
			OR: [
				{ username: { contains: search, mode: Prisma.QueryMode.insensitive } },
				{ email: { contains: search, mode: Prisma.QueryMode.insensitive } },
				{ userProfile: { displayName: { contains: search, mode: Prisma.QueryMode.insensitive } } }
			]
		} : {}

		const [total, users] = await this.pg.$transaction([
			this.pg.user.count({ where }),
			this.pg.user.findMany({
				where,
				skip: page * limit,
				take: limit,
				orderBy: { createdAt: 'desc' },
				include: {
					userProfile: true
				}
			})
		])

		return {
			data: users,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit)
			}
		}
	}
}
```

**Pontos Chave:**

- **Injeção do Prisma**: O cliente Prisma é injetado usando `@inject('PostgresqlClient')`.
- **Consultas Complexas**: Uso de `include` para carregar relacionamentos e `_count` para contadores.
- **Transações**: Uso de `$transaction` para operações que precisam ser atômicas.
- **Paginação**: Implementação de paginação para listagens.
- **Busca**: Implementação de busca com múltiplos campos usando `OR`.

### 2.5. Testes (`.spec.ts`)

Os testes verificam a funcionalidade completa da API, simulando requisições HTTP reais e validando as respostas e o estado do banco de dados.

**Responsabilidades:**

- Garantir que os endpoints da API funcionem conforme o esperado.
- Testar cenários de sucesso e falha, incluindo validações e tratamento de erros.
- Verificar a persistência correta dos dados no banco de dados.

**Exemplo de `create-user.spec.ts`:**

```typescript
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { AppModule } from 'src/app.module'
import { User } from 'src/shared/types/user.d'
import { setupApplication } from 'src/setup-application'
import * as request from 'supertest'
import { App } from 'supertest/types'
import { DataSource, Repository } from 'typeorm'

describe('/v1/users (POST)', () => {
	let app: INestApplication<App>
	let userRepository: Repository<User>

	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile()

		app = moduleFixture.createNestApplication()
		userRepository = moduleFixture.get<Repository<User>>('UserRepository')

		await userRepository.delete({})

		setupApplication(app)
		await app.init()
	})

	afterEach(async () => {
		const dataSource = app.get(DataSource)
		if (dataSource.isInitialized) {
			await dataSource.destroy()
		}
		await app.close()
	})

	it('should return 400 when required fields are missing', async () => {
		const response = await request(app.getHttpServer())
			.post('/api/v1/users')
			.send({
				username: 'testuser'
				// Missing required fields
			})

		expect(response.status).toEqual(400)
		expect(JSON.stringify(response.body)).toContain('INVALID_EMAIL_FORMAT')
	})

	it('should return 400 when password is too weak', async () => {
		const response = await request(app.getHttpServer())
			.post('/api/v1/users')
			.send({
				username: 'testuser',
				email: 'test@example.com',
				password: 'weak',
				confirmPassword: 'weak'
			})

		expect(response.status).toEqual(400)
		expect(JSON.stringify(response.body)).toContain('INVALID_PASSWORD_FORMAT')
	})

	it('should return 400 when passwords do not match', async () => {
		const response = await request(app.getHttpServer())
			.post('/api/v1/users')
			.send({
				username: 'testuser',
				email: 'test@example.com',
				password: 'StrongPass123!',
				confirmPassword: 'DifferentPass123!'
			})

		expect(response.status).toEqual(400)
		expect(JSON.stringify(response.body)).toContain('PASSWORDS_DO_NOT_MATCH')
	})

	it('should return 201 when user is created successfully', async () => {
		const userData = {
			username: 'testuser',
			email: 'test@example.com',
			password: 'StrongPass123!',
			confirmPassword: 'StrongPass123!'
		}

		const response = await request(app.getHttpServer())
			.post('/api/v1/users')
			.send(userData)

		const body = response.body as User
		const createdUser = await userRepository.findOneOrFail({
			where: { email: body.email },
		})

		expect(response.status).toEqual(201)
		expect(body.username).toEqual(userData.username)
		expect(body.email).toEqual(userData.email.toLowerCase())
		expect(createdUser.id).toBeDefined()
	})
})
```

**Pontos Chave:**

- **Configuração do Ambiente**: `beforeEach` e `afterEach` são usados para configurar e limpar o ambiente de teste.
- **Requisições HTTP**: A biblioteca `supertest` é utilizada para simular requisições HTTP.
- **Asserções**: `expect` é usado para verificar o status da resposta e o estado do banco de dados.
- **Cenários de Teste**: Inclui testes para casos de erro e casos de sucesso.

### 2.6. Documentação da Feature (`.feature.md`)

A documentação da feature descreve a funcionalidade em linguagem natural, utilizando o formato Gherkin (Dado, Quando, Então) para definir os cenários de uso.

**Responsabilidades:**

- Fornecer uma descrição clara e concisa da funcionalidade.
- Definir os requisitos e o comportamento esperado da API.
- Servir como uma referência para desenvolvedores e testadores.

**Exemplo de `create-user.feature.md`:**

````markdown
# Feature: Cadastro de Usuários

- Eu como usuário do sistema
- Quero me cadastrar na plataforma
- Para ter acesso às funcionalidades do sistema

## Cenários

**Campos obrigatórios ausentes**

- Dado que o usuário não informa campos obrigatórios
- Quando tenta criar uma conta
- Então deve retornar um erro com status code 400

```bash
POST /api/v1/users
--header 'Content-Type: application/json'
--body
{
  "username": "testuser"
  // Campos obrigatórios ausentes
}

--status 400
--body
{
  "message": "INVALID_EMAIL_FORMAT"
}
```

**Senha fraca**

- Dado que o usuário informa uma senha que não atende aos critérios de segurança
- Quando tenta criar uma conta
- Então deve retornar um erro com status code 400

```bash
POST /api/v1/users
--header 'Content-Type: application/json'
--body
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "weak",
  "confirmPassword": "weak"
}

--status 400
--body
{
  "message": "INVALID_PASSWORD_FORMAT"
}
```

**Senhas não coincidem**

- Dado que o usuário informa senhas diferentes nos campos password e confirmPassword
- Quando tenta criar uma conta
- Então deve retornar um erro com status code 400

```bash
POST /api/v1/users
--header 'Content-Type: application/json'
--body
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "StrongPass123!",
  "confirmPassword": "DifferentPass123!"
}

--status 400
--body
{
  "message": "PASSWORDS_DO_NOT_MATCH"
}
```

**Cadastro bem-sucedido**

- Dado que todos os dados são válidos
- Quando a API for chamada para criar um usuário
- Então deve retornar status 201 com os dados do usuário criado

```bash
POST /api/v1/users
--header 'Content-Type: application/json'
--body
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "StrongPass123!",
  "confirmPassword": "StrongPass123!"
}

--status 201
--body
{
  "id": "uuid",
  "username": "testuser",
  "email": "test@example.com",
  "createdAt": "2025-01-15T10:30:00Z"
}
```
````

**Pontos Chave:**

- **Formato Gherkin**: Utiliza "Eu como...", "Quero...", "Para..." para descrever a feature.
- **Exemplos de Requisição/Resposta**: Inclui exemplos completos de requisições e respostas esperadas.
- **Cenários de Erro**: Documenta todos os cenários de erro possíveis.

## 3. Diretrizes de Implementação Detalhadas

### 3.1. Tratamento de Erros

Erros devem ser tratados de forma consistente, retornando códigos de erro padronizados.

- **Códigos de Erro**: Use códigos de erro padronizados definidos em `@shared/errors`.
  - Exemplo: `'USER_ALREADY_EXISTS'`, `'USER_NOT_FOUND'`, `'INVALID_PASSWORD'`.
- **Validação de Schema**: Erros de validação são tratados automaticamente pelo middleware `schemaValidation`.
- **Tratamento no Controller**: Use try/catch para capturar erros e retornar respostas padronizadas.

### 3.2. Interação com o Banco de Dados

A interação com o banco de dados é realizada através do Prisma ORM nos repositórios.

- **Injeção do Cliente**: Use `@inject('PostgresqlClient')` para injetar o cliente Prisma.
- **Operações CRUD**: Use métodos do Prisma como `create()`, `findUnique()`, `update()`, `delete()`.
- **Relacionamentos**: Use `include` para carregar relacionamentos e `_count` para contadores.
- **Transações**: Use `$transaction()` para operações que precisam ser atômicas.
- **Consultas Complexas**: Use `where` com operadores Prisma para consultas avançadas.

### 3.3. Gateway Pattern

O Gateway Pattern é usado para abstrair integrações externas.

- **Abstração**: Encapsule todas as integrações externas em gateways específicos.
- **Retry Logic**: Implemente retry automático para operações que podem falhar temporariamente.
- **Circuit Breaker**: Implemente circuit breakers para prevenir cascata de falhas.
- **Cache**: Use cache quando apropriado para melhorar performance.
- **Fallbacks**: Implemente fallbacks para operações não críticas.

### 3.4. Segurança e Validação

A segurança e a validação são aspectos cruciais para garantir a integridade da aplicação.

- **Validação de Dados**: Sempre valide dados de entrada usando schemas Zod nos DTOs.
- **Autenticação**: Use `@Security('jwt', [])` para proteger rotas que requerem autenticação.
- **Validação de Negócio**: Implemente regras de negócio específicas nos controllers.
- **Sanitização**: Sempre sanitize dados de entrada (ex: `email.toLowerCase()`).

### 3.5. Logging e Monitoramento

O logging é essencial para monitorar o comportamento da aplicação.

#### 3.5.1. Sistema de Logger

**OBRIGATÓRIO**: Use o `Logger` centralizado em vez de `console.log()`:

```typescript
import { inject, injectable } from 'tsyringe'
import { Logger } from '@shared/utils/logger'

@injectable()
export class MyController extends Controller {
	constructor(
		private userRepository: UserRepository,
		@inject('Logger') private logger: Logger
	) {
		super()
		void this.logger // Necessário para evitar warning do TypeScript
	}

	public async myMethod() {
		this.logger.info('Operation started', { userId: '123' })
		this.logger.error('Operation failed', error)
		this.logger.warn('Warning message', { context: 'data' })
		this.logger.debug('Debug information', { details: 'info' })
	}
}
```

#### 3.5.2. Decorator @LogResponseTime

**OBRIGATÓRIO**: Use o decorator `@LogResponseTime` em TODOS os métodos de controller:

```typescript
import { LogResponseTime } from '@shared/decorators'

export class MyController extends Controller {
	@SuccessResponse(200)
	@Post('/my-endpoint')
	@LogResponseTime() // ← Aplicar no método específico, NÃO na classe
	public async myMethod() {
		// Método será automaticamente logado com tempo de resposta
	}
}
```

**⚠️ IMPORTANTE**: 
- Aplicar `@LogResponseTime()` nos **métodos específicos**, não na classe
- O decorator usa `this.logger` internamente, por isso o Logger deve estar injetado

#### 3.5.3. Níveis de Log

- **ERROR**: Erros críticos que impedem a operação
- **WARN**: Avisos sobre situações anômalas
- **INFO**: Informações gerais sobre operações
- **DEBUG**: Informações detalhadas para debugging

### 3.6. Documentação

#### 3.6.1. Arquivos .feature.md

**OBRIGATÓRIO**: Todos os arquivos `.feature.md` devem estar em **PORTUGUÊS**:

```markdown
# Funcionalidade: Nome da Funcionalidade

## Visão Geral
Descrição da funcionalidade em português.

## Regras de Negócio
- Regra 1 em português
- Regra 2 em português

## Cenários

### Cenário: Nome do cenário em português
```gherkin
Dado que sou um usuário autenticado
Quando envio uma requisição POST para "/api/v1/endpoint" com:
  | Campo | Valor |
  | field | "value" |
Então devo receber uma resposta 200 com:
  | Campo | Tipo |
  | field | string |
```

## Formato de Resposta

### Resposta de Sucesso (200)
```json
{
  "field": "value"
}
```

### Respostas de Erro
- **400**: `ERROR_CODE`
- **401**: `UNAUTHORIZED`
```

**⚠️ IMPORTANTE**: 
- **Texto em português**: Cenários, descrições, regras de negócio
- **Variáveis em inglês**: `password`, `email`, `token`, `userId`
- **Códigos de erro em inglês**: `UNAUTHORIZED`, `USER_NOT_FOUND`

#### 3.6.2. Comentários JSDoc dos Controllers

**OBRIGATÓRIO**: Comentários JSDoc devem estar em **INGLÊS** e ser completos:

```typescript
/**
 * Change user password and generate new authentication tokens
 * 
 * This endpoint allows authenticated users to change their current password.
 * Upon successful password change, new access and refresh tokens are automatically
 * generated and the refresh token is updated in the database.
 * 
 * @param body - Object containing the new password
 * @param req - Express request object with JWT token containing user information
 * @returns Promise resolving to SigninOutput with new tokens and user data, or error string
 * 
 * @example
 * ```typescript
 * // Request body
 * {
 *   "password": "NewSecurePassword123!"
 * }
 * 
 * // Success response
 * {
 *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": { ... }
 * }
 * ```
 */
@SuccessResponse(200)
@Post('/change-password')
@Security('jwt', [])
@LogResponseTime()
public async changePassword(/* ... */) {
```

**⚠️ IMPORTANTE**: 
- **Comentários JSDoc em inglês** para documentação da API
- **Incluir exemplos** de request/response
- **Documentar parâmetros** e retornos
- **Remover comentários em português** dos constructors

#### 3.5.4. Informações Úteis nos Logs

- **IDs de usuários**: Para rastrear ações específicas
- **Timestamps**: Para análise temporal
- **Contexto relevante**: Dados que ajudam a entender a situação
- **Tempo de resposta**: Para monitoramento de performance

#### 3.5.5. Listagem de Rotas

Use o `RouteLister` para exibir todas as rotas registradas:

```typescript
import { RouteLister } from '@shared/utils/route-lister'

// No startup da aplicação
const routeLister = container.resolve(RouteLister)
const routes = [
	{ method: 'POST', path: '/api/v1/users', controller: 'CreateUserController', action: 'createUser', tags: ['User Management'] },
	{ method: 'GET', path: '/api/v1/users', controller: 'GetUsersController', action: 'getUsers', tags: ['User Management'] },
	// ... outras rotas
]

routeLister.listRoutes(routes)
```

### 3.6. Configuração TSOA

A configuração TSOA é definida no arquivo `tsoa.json`.

**Configuração Essencial:**

```json
{
    "entryFile": "src/index.ts",
    "noImplicitAdditionalProperties": "throw-on-extras",
    "controllerPathGlobs": ["src/features/**/*.controller.ts"],
    "spec": {
      "outputDirectory": "src/tsoa",
      "specVersion": 3,
      "securityDefinitions": {
        "jwt": {
            "type": "http",
            "scheme": "bearer"
        }
      }
    },
    "routes": {
      "iocModule": "src/config/ioc.ts",
      "routesDir": "src/tsoa",
      "authenticationModule": "./src/shared/middlewares/security/index.ts"
    }
}
```

**Pontos Chave:**

- **Geração Automática**: TSOA gera automaticamente rotas e documentação Swagger.
- **Validação Rigorosa**: `noImplicitAdditionalProperties: "throw-on-extras"` garante validação rigorosa.
- **Injeção de Dependências**: Configuração do módulo IoC para injeção de dependências.
- **Autenticação**: Configuração do módulo de autenticação JWT.

### 3.7. Middlewares

Middlewares são usados para validação, autenticação e outras funcionalidades transversais.

**Middleware de Validação:**

```typescript
export const schemaValidation = (schema: ZodTypeAny, type: 'body' | 'query' | 'params' = 'body') =>
	async (req: ExRequest, res: ExResponse, next: NextFunction) => {
		const result = schema.safeParse(req[type])
		if (res.headersSent || result.success) return next()
		const issue = result.error.issues[0]
		let message: ApiMessage = issue.message as ApiMessage
		let statusCode = issue.code === 'invalid_type' ? messages[message] : 400
		
		return res.status(statusCode).json({ message })
	}
```

**Uso no Controller:**

```typescript
@Middlewares<RequestHandler>(schemaValidation(createUserSchema))
public async createUser(@Body() body: CreateUserInput) {
    // Lógica do método
}
```

### 3.8. Injeção de Dependências

O projeto usa `tsyringe` para injeção de dependências.

**Configuração no IoC:**

```typescript
// src/config/ioc.ts
import { container } from 'tsyringe'
import { PrismaClient } from '@prisma/client'

container.register('PostgresqlClient', {
    useValue: new PrismaClient()
})
```

**Uso nos Controllers e Repositórios:**

```typescript
@injectable()
export class CreateUserController {
    constructor(
        @inject('PostgresqlClient') private pg: PrismaClient,
        private userRepository: UserRepository,
        private userGateway: UserGateway
    ) {}
}
```

## 4. Versionamento de API

### 4.1. Estratégia de Versionamento

- **Versionamento por URL**: Use `/api/v1/`, `/api/v2/` para diferentes versões.
- **Estrutura de Pastas**: Cada versão tem sua própria pasta `v1/`, `v2/`.
- **Backward Compatibility**: Mantenha versões antigas funcionando durante transições.
- **Deprecation**: Documente e comunique deprecações com antecedência.

### 4.2. Migração entre Versões

- **Feature Flags**: Use feature flags para ativar/desativar funcionalidades.
- **Gradual Rollout**: Implemente rollouts graduais para novas versões.
- **Monitoring**: Monitore métricas de uso de cada versão.

## 5. Considerações Finais

- **Consistência**: Mantenha a consistência na estrutura de arquivos, nomes de variáveis, padrões de código e tratamento de erros em todo o projeto.
- **Reusabilidade**: Sempre que possível, identifique e extraia lógica comum para gateways ou utilitários compartilhados.
- **Testabilidade**: Escreva código que seja fácil de testar, com dependências claras e responsabilidades bem definidas.
- **Documentação**: Mantenha a documentação dos endpoints atualizada através dos comentários JSDoc e arquivos `.feature.md`.
- **Performance**: Use `include` seletivamente no Prisma para evitar over-fetching de dados.
- **Segurança**: Sempre valide e sanitize dados de entrada, use autenticação JWT adequadamente.
- **Versionamento**: Mantenha compatibilidade entre versões e documente mudanças breaking.

Ao seguir estas diretrizes, os Agentes LLM podem gerar código de alta qualidade que se integra perfeitamente ao projeto TSOA existente e adere aos nossos padrões de desenvolvimento, facilitando o versionamento e a manutenção da API.

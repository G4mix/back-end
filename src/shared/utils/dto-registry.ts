import { z } from 'zod'
import { Logger } from '@shared/utils/logger'

/**
 * Interface para schemas de rota
 */
export interface RouteSchema {
	input?: z.ZodSchema
	query?: z.ZodSchema
	params?: z.ZodSchema
	output?: z.ZodSchema
}

/**
 * Interface para DTOs que seguem o padrão Zod
 */
export interface ZodDTO {
	InputSchema?: z.ZodSchema
	QuerySchema?: z.ZodSchema
	ParamsSchema?: z.ZodSchema
	OutputSchema?: z.ZodSchema
}

/**
 * Registry automático de schemas de DTOs
 * 
 * Funcionalidades:
 * - Registro automático de schemas Zod dos DTOs
 * - Mapeamento de rotas para schemas
 * - Validação automática de entrada e saída
 * - Suporte a diferentes tipos de schemas (input, query, params, output)
 */
export class DTORegistry {
	private static instance: DTORegistry
	private routeSchemas: Map<string, RouteSchema> = new Map()
	private logger: Logger

	private constructor(logger: Logger) {
		this.logger = logger
	}

	/**
	 * Singleton instance
	 */
	static getInstance(logger: Logger): DTORegistry {
		if (!DTORegistry.instance) {
			DTORegistry.instance = new DTORegistry(logger)
		}
		return DTORegistry.instance
	}

	/**
	 * Registra um schema para uma rota específica
	 */
	registerRoute(routeKey: string, schema: RouteSchema): void {
		this.routeSchemas.set(routeKey, schema)
		this.logger.debug(`Schema registrado para rota: ${routeKey}`)
	}

	/**
	 * Registra schemas de um DTO automaticamente
	 * 
	 * @param routeKey - Chave da rota (ex: "POST /v1/auth/change-password")
	 * @param dtoModule - Módulo do DTO que contém os schemas
	 */
	registerDTO(routeKey: string, dtoModule: ZodDTO): void {
		const schema: RouteSchema = {}

		// Registra schemas disponíveis no DTO
		if (dtoModule.InputSchema) {
			schema.input = dtoModule.InputSchema
		}
		if (dtoModule.QuerySchema) {
			schema.query = dtoModule.QuerySchema
		}
		if (dtoModule.ParamsSchema) {
			schema.params = dtoModule.ParamsSchema
		}
		if (dtoModule.OutputSchema) {
			schema.output = dtoModule.OutputSchema
		}

		this.registerRoute(routeKey, schema)
		this.logger.info(`DTO registrado automaticamente para rota: ${routeKey}`, {
			schemas: Object.keys(schema)
		})
	}

	/**
	 * Obtém schema para uma rota específica
	 */
	getSchema(routeKey: string): RouteSchema | null {
		// Tenta encontrar schema exato primeiro
		if (this.routeSchemas.has(routeKey)) {
			return this.routeSchemas.get(routeKey)!
		}

		// Tenta encontrar schema por padrão (com parâmetros dinâmicos)
		for (const [key, schema] of this.routeSchemas.entries()) {
			if (this.matchesRoutePattern(key, routeKey)) {
				return schema
			}
		}

		return null
	}

	/**
	 * Lista todas as rotas registradas
	 */
	listRoutes(): string[] {
		return Array.from(this.routeSchemas.keys())
	}

	/**
	 * Verifica se a rota atual corresponde ao padrão do schema
	 */
	private matchesRoutePattern(pattern: string, route: string): boolean {
		const patternParts = pattern.split(' ')
		const routeParts = route.split(' ')

		if (patternParts.length !== routeParts.length) {
			return false
		}

		for (let i = 0; i < patternParts.length; i++) {
			// Verifica se é um parâmetro dinâmico (começa com /:)
			if (patternParts[i].startsWith('/:') && routeParts[i].startsWith('/')) {
				continue // Parâmetro dinâmico
			}
			// Verifica se é um parâmetro dinâmico sem barra inicial (apenas :id)
			if (patternParts[i].startsWith(':') && !patternParts[i].startsWith('/:')) {
				continue // Parâmetro dinâmico
			}

			// Compara caminhos dividindo por /
			if (patternParts[i].includes('/') && routeParts[i].includes('/')) {
				const patternPathParts = patternParts[i].split('/')
				const routePathParts = routeParts[i].split('/')

				if (patternPathParts.length !== routePathParts.length) {
					return false
				}

				let pathMatches = true
				for (let j = 0; j < patternPathParts.length; j++) {
					if (patternPathParts[j].startsWith(':')) {
						continue // Parâmetro dinâmico no caminho
					}
					if (patternPathParts[j] !== routePathParts[j]) {
						pathMatches = false
						break
					}
				}

				if (!pathMatches) {
					return false
				}
				continue
			}

			if (patternParts[i] !== routeParts[i]) {
				return false
			}
		}

		return true
	}

	/**
	 * Limpa todos os schemas registrados (útil para testes)
	 */
	clear(): void {
		this.routeSchemas.clear()
		this.logger.debug('Registry limpo')
	}
}

/**
 * Função helper para registrar DTOs de forma mais conveniente
 */
export function registerDTO(routeKey: string, dtoModule: ZodDTO, logger: Logger): void {
	const registry = DTORegistry.getInstance(logger)
	registry.registerDTO(routeKey, dtoModule)
}

/**
 * Função helper para obter schema de uma rota
 */
export function getRouteSchema(routeKey: string, logger: Logger): RouteSchema | null {
	const registry = DTORegistry.getInstance(logger)
	return registry.getSchema(routeKey)
}

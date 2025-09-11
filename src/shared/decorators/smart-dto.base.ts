import { z } from 'zod'

/**
 * Classe base para DTOs inteligentes que podem serializar e deserializar automaticamente
 */
export abstract class SmartDTO<T = any> {
	protected rawData: any = {}
	protected validationSchema?: z.ZodSchema<T>

	constructor(data?: any) {
		if (data) {
			this.fromRaw(data)
		}
	}

	/**
	 * Cria uma instância do DTO a partir de dados brutos
	 */
	static from<T extends SmartDTO>(this: new (data?: any) => T, data: any): T {
		return new this(data)
	}

	/**
	 * Cria múltiplas instâncias do DTO a partir de um array de dados
	 */
	static fromArray<T extends SmartDTO>(this: new (data?: any) => T, dataArray: any[]): T[] {
		return dataArray.map(data => new this(data))
	}

	/**
	 * Carrega dados brutos no DTO aplicando transformações e validações
	 */
	fromRaw(data: any): this {
		this.rawData = data
		this.applyMappings()
		this.applyTransforms()
		this.validate()
		return this
	}

	/**
	 * Serializa o DTO para o formato de saída
	 */
	toJSON(): any {
		const result: any = {}
		const serializationRules = Reflect.getMetadata('serialization', this.constructor) || {}
		const transforms = Reflect.getMetadata('transforms', this.constructor) || {}

		// Aplica regras de serialização
		for (const [key, value] of Object.entries(this)) {
			if (key.startsWith('_') || key === 'rawData') continue
			
			const shouldSerialize = serializationRules[key] !== false
			if (!shouldSerialize) continue

			// Aplica transformações se existirem
			const transformer = transforms[key]
			if (transformer) {
				result[key] = transformer(value)
			} else {
				result[key] = value
			}
		}

		return result
	}

	/**
	 * Aplica mapeamentos de propriedades definidos pelos decorators
	 */
	private applyMappings(): void {
		const mappings = Reflect.getMetadata('mappings', this.constructor) || {}
		
		for (const [targetProperty, sourcePath] of Object.entries(mappings)) {
			const value = this.getNestedValue(this.rawData, sourcePath as string)
			;(this as any)[targetProperty] = value
		}
	}

	/**
	 * Aplica transformações definidas pelos decorators
	 */
	private applyTransforms(): void {
		const transforms = Reflect.getMetadata('transforms', this.constructor) || {}
		
		for (const [property, transformer] of Object.entries(transforms)) {
			const currentValue = (this as any)[property]
			if (currentValue !== undefined) {
				(this as any)[property] = (transformer as (value: any) => any)(currentValue)
			}
		}
	}

	/**
	 * Valida os dados usando o schema Zod se definido
	 */
	private validate(): void {
		if (this.validationSchema) {
			const result = this.validationSchema.safeParse(this)
			if (!result.success) {
				throw new Error(`Validation failed: ${result.error.message}`)
			}
		}
	}

	/**
	 * Obtém valor aninhado de um objeto usando notação de ponto
	 */
	private getNestedValue(obj: any, path: string): any {
		return path.split('.').reduce((current, key) => current?.[key], obj)
	}

	/**
	 * Define o schema de validação para o DTO
	 */
	protected setValidationSchema(schema: z.ZodSchema<T>): void {
		this.validationSchema = schema
	}

	/**
	 * Clona o DTO com novos dados
	 */
	clone(newData?: any): this {
		const cloned = Object.create(Object.getPrototypeOf(this))
		Object.assign(cloned, this)
		if (newData) {
			cloned.fromRaw(newData)
		}
		return cloned
	}

	/**
	 * Verifica se o DTO tem dados válidos
	 */
	isValid(): boolean {
		try {
			this.validate()
			return true
		} catch {
			return false
		}
	}

	/**
	 * Retorna apenas as propriedades que devem ser serializadas
	 */
	getSerializableProperties(): string[] {
		const serializationRules = Reflect.getMetadata('serialization', this.constructor) || {}
		return Object.keys(this).filter(key => 
			!key.startsWith('_') && 
			key !== 'rawData' && 
			serializationRules[key] !== false
		)
	}
}

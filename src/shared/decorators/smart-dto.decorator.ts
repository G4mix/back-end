import 'reflect-metadata'

/**
 * Decorator para transformar propriedades de dados
 * Permite aplicar transformações automáticas durante a serialização
 */
export function Transform(transformer: (value: any) => any) {
	return function (target: any, propertyKey: string) {
		const existingTransforms = Reflect.getMetadata('transforms', target) || {}
		existingTransforms[propertyKey] = transformer
		Reflect.defineMetadata('transforms', existingTransforms, target)
	}
}

/**
 * Decorator para definir propriedades que devem ser serializadas
 * Útil para controlar quais campos aparecem na saída
 */
export function Serialize(include: boolean = true) {
	return function (target: any, propertyKey: string) {
		const existingSerialization = Reflect.getMetadata('serialization', target) || {}
		existingSerialization[propertyKey] = include
		Reflect.defineMetadata('serialization', existingSerialization, target)
	}
}

/**
 * Decorator para definir validações Zod para propriedades
 */
export function Validate(schema: any) {
	return function (target: any, propertyKey: string) {
		const existingValidations = Reflect.getMetadata('validations', target) || {}
		existingValidations[propertyKey] = schema
		Reflect.defineMetadata('validations', existingValidations, target)
	}
}

/**
 * Decorator para definir mapeamentos de propriedades
 * Útil para renomear campos ou mapear de estruturas aninhadas
 */
export function MapFrom(sourcePath: string) {
	return function (target: any, propertyKey: string) {
		const existingMappings = Reflect.getMetadata('mappings', target) || {}
		existingMappings[propertyKey] = sourcePath
		Reflect.defineMetadata('mappings', existingMappings, target)
	}
}

/**
 * Decorator para definir transformações de data
 * Converte automaticamente Date para ISO string
 */
export function DateField() {
	return Transform((value: Date | string) => {
		if (value instanceof Date) {
			return value.toISOString()
		}
		if (typeof value === 'string') {
			return new Date(value).toISOString()
		}
		return value
	})
}

/**
 * Decorator para definir transformações de array
 * Aplica transformações a cada item do array
 */
export function ArrayTransform(itemTransformer: (item: any) => any) {
	return Transform((value: any[]) => {
		if (Array.isArray(value)) {
			return value.map(itemTransformer)
		}
		return value
	})
}

import { z } from 'zod'

/**
 * Decorator para validação de DTOs com schemas Zod
 * Este decorator integra a validação com o processamento de DTOs
 */

export function ValidateInput(schema: z.ZodSchema) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		// Armazena o schema de validação no metadata
		Reflect.defineMetadata('inputValidationSchema', schema, target, propertyKey)
		
		return descriptor
	}
}

export function ValidateOutput(schema: z.ZodSchema) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		// Armazena o schema de validação no metadata
		Reflect.defineMetadata('outputValidationSchema', schema, target, propertyKey)
		
		return descriptor
	}
}

/**
 * Decorator para validação customizada de DTOs
 */
export function ValidateWith(validator: (data: any) => boolean | string) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		// Armazena o validador customizado no metadata
		Reflect.defineMetadata('customValidator', validator, target, propertyKey)
		
		return descriptor
	}
}

/**
 * Decorator para transformação de dados antes da validação
 */
export function TransformInput(transformer: (data: any) => any) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		// Armazena o transformador no metadata
		Reflect.defineMetadata('inputTransformer', transformer, target, propertyKey)
		
		return descriptor
	}
}

/**
 * Decorator para transformação de dados após a validação
 */
export function TransformOutput(transformer: (data: any) => any) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		// Armazena o transformador no metadata
		Reflect.defineMetadata('outputTransformer', transformer, target, propertyKey)
		
		return descriptor
	}
}

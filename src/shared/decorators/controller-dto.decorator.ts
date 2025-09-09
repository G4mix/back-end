import 'reflect-metadata'

/**
 * Decorator para definir qual DTO usar para entrada (body/query/params)
 * O middleware irá automaticamente validar e injetar os dados processados
 */
export function UseInputDTO(dtoClass: new (data?: any) => any) {
	return function (target: any, propertyKey: string) {
		Reflect.defineMetadata('inputDTO', dtoClass, target, propertyKey)
	}
}

/**
 * Decorator para definir qual DTO usar para saída (response)
 * O middleware irá automaticamente serializar a resposta
 */
export function UseOutputDTO(dtoClass: new (data?: any) => any) {
	return function (target: any, propertyKey: string) {
		Reflect.defineMetadata('outputDTO', dtoClass, target, propertyKey)
	}
}

/**
 * Decorator para habilitar serialização automática da resposta
 * Se não especificar um DTO de saída, usa serialização genérica
 */
export function AutoSerialize() {
	return function (target: any, propertyKey: string) {
		Reflect.defineMetadata('autoSerialize', true, target, propertyKey)
	}
}

/**
 * Decorator para definir validação customizada
 * Permite adicionar validações específicas além do DTO
 */
export function ValidateWith(validator: (data: any) => boolean | string) {
	return function (target: any, propertyKey: string) {
		const existingValidators = Reflect.getMetadata('customValidators', target, propertyKey) || []
		existingValidators.push(validator)
		Reflect.defineMetadata('customValidators', existingValidators, target, propertyKey)
	}
}

/**
 * Decorator para definir transformações customizadas antes da serialização
 */
export function TransformResponse(transformer: (data: any) => any) {
	return function (target: any, propertyKey: string) {
		Reflect.defineMetadata('responseTransformer', transformer, target, propertyKey)
	}
}

/**
 * Decorator para definir tratamento de erros customizado
 */
export function HandleErrors(errorHandler: (error: Error, req: any, res: any) => any) {
	return function (target: any, propertyKey: string) {
		Reflect.defineMetadata('errorHandler', errorHandler, target, propertyKey)
	}
}

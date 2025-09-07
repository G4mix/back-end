export function LogResponseTime() {
	return function (
		_target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		const originalMethod = descriptor.value as (
			...args: unknown[]
		) => Promise<unknown>

		descriptor.value = async function (
			this: any,
			...args: unknown[]
		) {
			const startTime = new Date().getTime()

			const params = args.length > 0 ? args[0] : {}
			this.logger.info(`Starting ${propertyKey}`, params)

			try {
				const result = (await originalMethod.apply(this, args)) as unknown

				const responseTime = new Date().getTime() - startTime
				this.logger.info(
					`Finished ${propertyKey}. Response time: ${responseTime}ms`,
				)

				return result
			} catch (error) {
				const responseTime = new Date().getTime() - startTime
				this.logger.error(
					`Error in ${propertyKey}. Response time: ${responseTime}ms`,
					error,
				)
				throw error
			}
		}

		return descriptor
	}
}

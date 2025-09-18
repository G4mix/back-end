/**
 * Decorator to automatically log response time for controller methods
 * Replaces the manual pattern of:
 * - const startTime = new Date().getTime();
 * - this.logger.log('Starting', ...);
 * - const responseTime = new Date().getTime() - startTime;
 * - this.logger.log('Finished. Response time: ${responseTime}ms');
 */
export function LogResponseTime() {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as (
      ...args: unknown[]
    ) => Promise<unknown>;

    descriptor.value = async function (
      this: {
        logger: {
          log: (message: string, ...args: unknown[]) => void;
          error: (message: string, error?: unknown) => void;
        };
      },
      ...args: unknown[]
    ) {
      const startTime = new Date().getTime();

      const safeArgs = args.filter(
        (arg) =>
          !(
            arg &&
            typeof arg === 'object' &&
            'headers' in arg &&
            'method' in arg
          ),
      );

      this.logger.log(`Starting ${propertyKey}`, safeArgs);

      try {
        const result = (await originalMethod.apply(this, args)) as unknown;

        const responseTime = new Date().getTime() - startTime;
        this.logger.log(
          `Finished ${propertyKey}. Response time: ${responseTime}ms`,
        );

        return result;
      } catch (error) {
        const responseTime = new Date().getTime() - startTime;
        this.logger.error(
          `Error in ${propertyKey}. Response time: ${responseTime}ms`,
          error,
        );
        throw error;
      }
    };

    return descriptor;
  };
}

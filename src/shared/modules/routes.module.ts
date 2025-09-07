import { injectable, singleton, inject } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { App } from '../../config/app'
import { StartupModule } from './startup.module'

@injectable()
@singleton()
export class RoutesModule implements StartupModule {
	public readonly name = 'Routes Module'

	constructor(@inject('Logger') private logger: Logger) {}

	public async initialize(): Promise<void> {
		this.logger.info('Registering API routes...')
		App.routes()
		this.logger.info('API routes registered successfully')
	}
}

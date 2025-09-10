import { injectable, singleton, inject } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { App } from '../../config/app'
import { StartupModule } from './startup.module'

@injectable()
@singleton()
export class ExpressModule implements StartupModule {
	public readonly name = 'Express Module'

	constructor(@inject('Logger') private logger: Logger) {}

	public async initialize(): Promise<void> {
		this.logger.info('Setting up Express middleware...')
		App.config()
		App.configValidation(this.logger)
		this.logger.info('Express middleware configured successfully')
	}
}

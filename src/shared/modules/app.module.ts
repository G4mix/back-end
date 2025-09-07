import { injectable, singleton, inject } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { PrismaClient } from '@prisma/client'
import { StartupModuleManager } from './startup.module'
import { ExpressModule } from './express.module'
import { RoutesModule } from './routes.module'
import { RoutesInfoModule } from './routes-info.module'
import { DatabaseModule } from './database.module'
import { ShutdownModule } from './shutdown.module'

@injectable()
@singleton()
export class AppModule {
	constructor(
		@inject('Logger') private logger: Logger,
		@inject('StartupModuleManager') private startupManager: StartupModuleManager,
		@inject('PostgresqlClient') private prisma: PrismaClient
	) {}

	public async initialize(): Promise<void> {
		this.logger.info('🏗️  Setting up application modules...')

		this.startupManager
			.registerModule(new DatabaseModule(this.logger, this.prisma))
			.registerModule(new ExpressModule(this.logger))
			.registerModule(new RoutesModule(this.logger))
			.registerModule(new RoutesInfoModule(this.logger))
			.registerModule(new ShutdownModule(this.logger, this.prisma))

		await this.startupManager.initializeAll()

		this.logger.info('🎯 Application modules ready!')
	}

	public isReady(): boolean {
		return this.startupManager.isReady()
	}
}

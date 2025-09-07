import { injectable, inject } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { PrismaClient } from '@prisma/client'
import { StartupModule } from './startup.module'

@injectable()
export class DatabaseModule implements StartupModule {
	readonly name = 'Database Connection'

	constructor(
		@inject('Logger') private logger: Logger,
		@inject('PostgresqlClient') private prisma: PrismaClient
	) {}

	public async initialize(): Promise<void> {
		this.logger.info('🔌 Testing database connection...')
		
		try {
			await this.prisma.$connect()
			this.logger.info('✅ Database connection successful!')
			
			await this.prisma.$queryRaw`SELECT 1 as test`
			this.logger.info('✅ Database query test successful!')
			
			const dbInfo = await this.prisma.$queryRaw`
				SELECT 
					current_database() as database_name,
					current_user as current_user,
					version() as postgres_version
			`
			this.logger.info('📊 Database info:', dbInfo)
			
		} catch (error) {
			this.logger.error('❌ Database connection failed:', error)
			throw new Error(`Database connection failed: ${error}`)
		}
	}
}

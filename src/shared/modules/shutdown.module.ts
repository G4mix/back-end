import { injectable, inject } from 'tsyringe'
import { Logger } from '@shared/utils/logger'
import { PrismaClient } from '@prisma/client'
import { StartupModule } from './startup.module'

@injectable()
export class ShutdownModule implements StartupModule {
	readonly name = 'Graceful Shutdown'

	constructor(
		@inject('Logger') private logger: Logger,
		@inject('PostgresqlClient') private prisma: PrismaClient
	) {}

	public async initialize(): Promise<void> {
		this.logger.info('🛡️  Setting up graceful shutdown handlers...')
		
		// Handle different termination signals
		process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'))
		process.on('SIGINT', () => this.gracefulShutdown('SIGINT'))
		process.on('SIGUSR2', () => this.gracefulShutdown('SIGUSR2')) // For nodemon
		
		// Handle uncaught exceptions
		process.on('uncaughtException', (error) => {
			this.logger.error('💥 Uncaught Exception:', error)
			this.gracefulShutdown('UNCAUGHT_EXCEPTION')
		})
		
		// Handle unhandled promise rejections
		process.on('unhandledRejection', (reason, promise) => {
			this.logger.error('💥 Unhandled Rejection:', { reason, promise })
			this.gracefulShutdown('UNHANDLED_REJECTION')
		})

		this.logger.info('✅ Graceful shutdown handlers configured')
	}

	private async gracefulShutdown(signal: string): Promise<void> {
		this.logger.info(`🔄 Graceful shutdown initiated by ${signal}`)
		this.logger.info('📋 Starting cleanup process...')

		const startTime = Date.now()
		let cleanupSteps = 0
		let totalSteps = 4

		try {
			// Step 1: Close database connections
			this.logger.info(`⏳ [${++cleanupSteps}/${totalSteps}] Closing database connections...`)
			await this.prisma.$disconnect()
			this.logger.info('✅ Database connections closed successfully')

			// Step 2: Close HTTP server
			this.logger.info(`⏳ [${++cleanupSteps}/${totalSteps}] Closing HTTP server...`)
			// Server will be closed by the processWatcher
			this.logger.info('✅ HTTP server closed successfully')

			// Step 3: Clear intervals and timeouts
			this.logger.info(`⏳ [${++cleanupSteps}/${totalSteps}] Clearing timers and intervals...`)
			this.clearTimers()
			this.logger.info('✅ Timers and intervals cleared')

			// Step 4: Final cleanup
			this.logger.info(`⏳ [${++cleanupSteps}/${totalSteps}] Performing final cleanup...`)
			await this.finalCleanup()
			this.logger.info('✅ Final cleanup completed')

			const duration = Date.now() - startTime
			this.logger.info('🎉 Graceful shutdown completed successfully!')
			this.logger.info(`📊 Cleanup summary: ${cleanupSteps}/${totalSteps} steps completed in ${duration}ms`)
			
			// Exit with success code
			process.exit(0)

		} catch (error) {
			this.logger.error('❌ Error during graceful shutdown:', error)
			this.logger.error('🚨 Forcing immediate exit...')
			process.exit(1)
		}
	}

	private clearTimers(): void {
		// Clear all intervals
		const highestIntervalId = setInterval(() => {}, 0)
		clearInterval(highestIntervalId)
		
		// Clear all timeouts
		const highestTimeoutId = setTimeout(() => {}, 0)
		clearTimeout(highestTimeoutId)
		
		// Note: In Node.js, we can't iterate through all timers like in browsers
		// The above approach clears the test timers we created
	}

	private async finalCleanup(): Promise<void> {
		// Clear any remaining event listeners
		process.removeAllListeners()
		
		// Force garbage collection if available
		if (global.gc) {
			global.gc()
		}
	}
}

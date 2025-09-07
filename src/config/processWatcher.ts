import { container } from '@ioc'
import { App } from './app'
import { Logger } from '@shared/utils/logger'

export const processWatcher = (app: App) => {
	const logger = container.resolve<Logger>('Logger')
	
	logger.info('🛡️  Process watcher initialized')
	logger.info('📡 Listening for termination signals...')
	
	// The ShutdownModule will handle graceful shutdown
	// This is kept for backward compatibility and HTTP server closure
	process.on('SIGTERM', () => {
		logger.info('📨 SIGTERM signal received - graceful shutdown will be handled by ShutdownModule')
		if (app.isRunning()) {
			logger.info('🔄 Closing HTTP server...')
			app.stop()
		}
	})
	
	process.on('SIGINT', () => {
		logger.info('📨 SIGINT signal received - graceful shutdown will be handled by ShutdownModule')
		if (app.isRunning()) {
			logger.info('🔄 Closing HTTP server...')
			app.stop()
		}
	})
}
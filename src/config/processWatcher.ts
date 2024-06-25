import { PrismaClient } from '@prisma/client'
import { container } from '@ioc'
import { App } from './app'

export const processWatcher = (app: App) => {
	process.on('SIGTERM', () => stopApplication())
	process.on('SIGINT', () => stopApplication())
	function stopApplication() {
		console.log('> [app] Stopping app')
		if (app.isRunning()) app.stop()
		container.resolve<PrismaClient>('PrismaClient').$disconnect()
		console.log('> [app] App finished')
	}
}
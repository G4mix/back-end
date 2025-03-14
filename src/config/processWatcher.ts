import { PrismaClient } from '@prisma/client'
import { container } from '@ioc'
import { App } from './app'

export const processWatcher = (app: App) => {
	process.on('SIGTERM', async () => await stopApplication())
	process.on('SIGINT', async () => await stopApplication())

	async function stopApplication() {
		console.log('> [app] Stopping app')
		if (app.isRunning()) await app.stop()
		await container.resolve<PrismaClient>('PostgresqlClient').$disconnect()
		console.log('> [app] App finished')
	}
}
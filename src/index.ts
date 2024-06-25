import 'reflect-metadata'
import { App, processWatcher } from '@config'
import { PrismaClient } from '@prisma/client'
import { container } from '@ioc'

container
	.register<PrismaClient>('PostgresqlClient', { useValue: new PrismaClient() })

export const app = container.resolve<App>(App)
try {
	app.start()
	processWatcher(app)
} catch(err) {
	console.log(err)
}

export default app.getInstance()
import 'reflect-metadata'
import { S3ClientOptions, SESClientOptions } from '@constants'
import { App, processWatcher } from '@config'
import { PrismaClient } from '@prisma/client'
import { container } from '@ioc'
import { S3Client } from '@aws-sdk/client-s3'
import { SESClient } from '@aws-sdk/client-ses'

container
	.register<PrismaClient>('PostgresqlClient', { useValue: new PrismaClient() })
	.register('SESClient', { useValue: new SESClient(SESClientOptions) })
	.register('S3Client', { useValue: new S3Client(S3ClientOptions) })

export const app = container.resolve<App>(App)
try {
	app.start()
	processWatcher(app)
} catch(err) {
	console.log(err)
}

export default app.getInstance()
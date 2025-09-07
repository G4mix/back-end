import 'reflect-metadata'
import { S3ClientOptions, SESClientOptions } from '@shared/constants'
import { App, processWatcher } from '@config'
import { PrismaClient } from '@prisma/client'
import { container } from '@ioc'
import { S3Client } from '@aws-sdk/client-s3'
import { SESClient } from '@aws-sdk/client-ses'

container
	.register<PrismaClient>('PostgresqlClient', { useValue: new PrismaClient() })
	.register('SESClient', { useValue: new SESClient(SESClientOptions) })
	.register('S3Client', { useValue: new S3Client(S3ClientOptions) })

import { UserRepository } from '@shared/repositories/user.repository'
import { IdeaRepository } from '@shared/repositories/idea.repository'
import { CommentRepository } from '@shared/repositories/comment.repository'
import { FollowRepository } from '@shared/repositories/follow.repository'
import { LikeRepository } from '@shared/repositories/like.repository'
import { ViewRepository } from '@shared/repositories/view.repository'

container
	.register('UserRepository', { useClass: UserRepository })
	.register('IdeaRepository', { useClass: IdeaRepository })
	.register('CommentRepository', { useClass: CommentRepository })
	.register('FollowRepository', { useClass: FollowRepository })
	.register('LikeRepository', { useClass: LikeRepository })
	.register('ViewRepository', { useClass: ViewRepository })

import { AuthGateway } from '@shared/gateways/auth.gateway'
import { UserGateway } from '@shared/gateways/user.gateway'
import { SESGateway } from '@shared/gateways/ses.gateway'
import { S3Gateway } from '@shared/gateways/s3.gateway'

import { Logger, RouteLister } from '@shared/utils'

import { AppModule, StartupModuleManager } from '@shared/modules'

container
	.register('AuthGateway', { useClass: AuthGateway })
	.register('UserGateway', { useClass: UserGateway })
	.register('SESGateway', { useClass: SESGateway })
	.register('S3Gateway', { useClass: S3Gateway })
	.register('Logger', { useClass: Logger })
	.register('RouteLister', { useClass: RouteLister })
	.register('StartupModuleManager', { useClass: StartupModuleManager })
	.register('AppModule', { useClass: AppModule })

export const app = container.resolve<App>(App)

console.log('🚀 Starting Gamix Backend Application...')
console.log('📋 Initializing dependency injection container...')

try {
	app.start().then(() => {
		console.log('🎯 Application startup completed successfully!')
		processWatcher(app)
	}).catch(error => {
		console.error('❌ Failed to start application:', error)
		console.error('🚨 Application startup failed - exiting...')
		process.exit(1)
	})
} catch(err) {
	console.error('💥 Critical error during application initialization:', err)
	console.error('🚨 Application initialization failed - exiting...')
	process.exit(1)
}

export default app.getInstance()
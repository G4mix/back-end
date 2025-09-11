import type { IncomingMessage, Server, ServerResponse } from 'http'
import express, {
	json,
	urlencoded,
	type Application,
	type Request as ExRequest,
	type Response as ExResponse,
} from 'express'
import { RegisterRoutes } from '@tsoa-build/routes'
import { singleton, inject } from 'tsyringe'
import { env } from '@config/env'
import swaggerUi from 'swagger-ui-express'
import cors from 'cors'
import { AppModule } from '@shared/modules/app.module'
import { setupAutoValidationMiddleware } from '@shared/middlewares/auto-validation.middleware'
import { Logger } from '@shared/utils/logger'

@singleton()
export class App {
	public static instance: Application
	private static server: Server<typeof IncomingMessage, typeof ServerResponse>
	
	constructor(
		@inject('AppModule') private appModule: AppModule,
		@inject('Logger') private logger: Logger
	) {
		App.instance = express()
	}

	public async start(): Promise<App> {
		if (this.isRunning()) return this
		
		try {
			await this.appModule.initialize()
			
			const serverPort = env['PORT'] || 8080
			App.server = App.instance.listen(serverPort, () => {
				this.logger.log(`🌐 Server listening on port ${serverPort} - http://localhost:${serverPort}/docs`)
			})
		} catch (error) {
			this.logger.error('❌ Failed to start application:', error)
			throw error
		}
		
		return this
	}

	public stop(): App {
		if (App.server && App.server.listening) {
			this.logger.log('🔄 Closing HTTP server...')
			App.server.close(() => {
				this.logger.log('✅ HTTP server closed successfully')
			})
		}
		return this
	}

	public isRunning(): boolean {
		return App.server && App.server.listening
	}

	public getInstance(): Application {
		return App.instance
	}

	public static config(): void {
		App.instance.use(urlencoded({ extended: true }))
		App.instance.use(json())
		App.instance.use(corsMiddleware())
		App.instance.disable('x-powered-by')
	}

	public static configValidation(logger: Logger): void {
		setupAutoValidationMiddleware(App.instance, logger)
	}


	public static routes(): void {
		App.instance.use('/docs', swaggerUi.serve, async (_req: ExRequest, res: ExResponse) => {
			return res.send(swaggerUi.generateHTML(await import('@tsoa-build/swagger.json')))
		})
		RegisterRoutes(App.instance)
	}
}

function corsMiddleware() {
	return (req: ExRequest, res: ExResponse, next: any) => {
		cors({
			allowedHeaders: ['Authorization', 'Content-Type'],
			exposedHeaders: '*',
			credentials: true,
			methods: ['OPTIONS', 'GET', 'PUT', 'PATCH', 'POST', 'DELETE'],
			origin: '*'
		})(req, res, next)
	}
}
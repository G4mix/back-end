import type { IncomingMessage, Server, ServerResponse } from 'http'
import express, {
	json,
	urlencoded,
	type Application,
	type Request as ExRequest,
	type Response as ExResponse,
} from 'express'
import { RegisterRoutes } from '@tsoa-build/routes'
import { singleton } from 'tsyringe'
import { env } from '@config'
import swaggerUi from 'swagger-ui-express'
import cors from 'cors'

@singleton()
export class App {
	private static instance: Application
	private static server: Server<typeof IncomingMessage, typeof ServerResponse>
	constructor() {
		App.instance = express()
		App.config()
		App.routes()
	}

	public start(): App {
		if (this.isRunning()) return this
		App.server = App.instance.listen(env['PORT'] as string, async () => {
			console.log(`> [app] App listening at the port ${env['PORT']}`)
		})
		return this
	}
	public stop(): App {
		App.server.close()
		return this
	}
	public isRunning(): boolean {
		return App.server && App.server.listening
	}

	public getInstance(): Application {
		return App.instance
	}
	private static config(): void {
		App.instance.use(urlencoded({ extended: true }))
		App.instance.use(json())
		App.instance.use((req, res, next) => {
			cors({
				allowedHeaders: ['Authorization', 'Content-Type'],
				exposedHeaders: '*',
				credentials: true,
				methods: ['OPTIONS', 'GET', 'PUT', 'PATCH', 'POST', 'DELETE'],
				origin: '*'
			})(req, res, next)
		})
		App.instance.disable('x-powered-by')
	}

	private static routes(): void {
		App.instance.use('/api/v1/docs', swaggerUi.serve, async (_req: ExRequest, res: ExResponse) => {
			return res.send(swaggerUi.generateHTML(await import('@tsoa-build/swagger.json')))
		})
		RegisterRoutes(App.instance)
	}
}
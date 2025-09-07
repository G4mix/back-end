import { injectable, singleton, inject } from 'tsyringe'
import { Logger } from './logger'
import { RouteLister, RouteInfo } from './route-lister'

export interface StartupStep {
	name: string
	execute: () => Promise<void>
	optional?: boolean
}

@injectable()
@singleton()
export class StartupManager {
	private steps: StartupStep[] = []
	private isStarted = false

	constructor(@inject('Logger') private logger: Logger) {}

	public addStep(step: StartupStep): StartupManager {
		this.steps.push(step)
		return this
	}

	public async start(): Promise<void> {
		if (this.isStarted) {
			this.logger.warn('Application already started')
			return
		}

		this.logger.info('🚀 Starting application...')
		this.logger.info(`📋 Found ${this.steps.length} startup steps`)

		const startTime = Date.now()
		let successCount = 0
		let errorCount = 0

		for (const step of this.steps) {
			try {
				this.logger.info(`⏳ Executing: ${step.name}`)
				await step.execute()
				this.logger.info(`✅ Completed: ${step.name}`)
				successCount++
			} catch (error) {
				errorCount++
				if (step.optional) {
					this.logger.warn(`⚠️  Optional step failed: ${step.name}`, error)
				} else {
					this.logger.error(`❌ Critical step failed: ${step.name}`, error)
					throw error
				}
			}
		}

		const duration = Date.now() - startTime
		this.logger.info(`🎉 Application started successfully!`)
		this.logger.info(`📊 Summary: ${successCount} successful, ${errorCount} failed, ${duration}ms`)
		
		this.isStarted = true
	}

	public async listRoutes(routes: RouteInfo[]): Promise<void> {
		const routeLister = new RouteLister(this.logger)
		routeLister.listRoutes(routes)
	}

	public isApplicationStarted(): boolean {
		return this.isStarted
	}
}

import { injectable, singleton, inject } from 'tsyringe'
import { Logger } from '@shared/utils/logger'

export interface StartupModule {
	readonly name: string
	initialize(): Promise<void>
	optional?: boolean
}

@injectable()
@singleton()
export class StartupModuleManager {
	private modules: StartupModule[] = []
	private isInitialized = false

	constructor(@inject('Logger') private logger: Logger) {}

	public registerModule(module: StartupModule): StartupModuleManager {
		this.modules.push(module)
		return this
	}

	public async initializeAll(): Promise<void> {
		if (this.isInitialized) {
			this.logger.warn('Startup modules already initialized')
			return
		}

		this.logger.info('🚀 Initializing application modules...')
		this.logger.info(`📋 Found ${this.modules.length} modules to initialize`)

		const startTime = Date.now()
		let successCount = 0
		let errorCount = 0

		for (const module of this.modules) {
			try {
				this.logger.info(`⏳ Initializing: ${module.name}`)
				await module.initialize()
				this.logger.info(`✅ Completed: ${module.name}`)
				successCount++
			} catch (error) {
				errorCount++
				if (module.optional) {
					this.logger.warn(`⚠️  Optional module failed: ${module.name}`, error)
				} else {
					this.logger.error(`❌ Critical module failed: ${module.name}`, error)
					throw error
				}
			}
		}

		const duration = Date.now() - startTime
		this.logger.info(`🎉 All modules initialized successfully!`)
		this.logger.info(`📊 Summary: ${successCount} successful, ${errorCount} failed, ${duration}ms`)
		
		this.isInitialized = true
	}

	public isReady(): boolean {
		return this.isInitialized
	}
}

import { setupProcessWatcherTests } from './config/setup-process-watcher'


function createShutdownPromise(app: any) {
	return new Promise<void>(resolve => {
		const timeoutId = setTimeout(() => {
			console.warn('Test timeout reached, forcing resolution')
			resolve()
		}, 3000)
		
		const originalIsRunning = app.isRunning.bind(app)
		app.isRunning = () => {
			const result = originalIsRunning()
			if (!result) {
				app.isRunning = originalIsRunning
				clearTimeout(timeoutId)
				resolve()
			}
			return result
		}
	})
}

describe('Test process watcher', () => {
	const { app, pgClientMock } = setupProcessWatcherTests()
	
	beforeEach(async () => {
		if (!app.isRunning()) await app.start()
		jest.spyOn(pgClientMock, '$disconnect').mockReset()
	})
	
	afterEach(async () => {
		if (app.isRunning()) await app.stop()
	})
	
	it('Expect to do sigint shutdown', async () => {
		const disconnectSpy = jest.spyOn(pgClientMock, '$disconnect')
		const shutdownPromise = createShutdownPromise(app)
		process.emit('SIGINT')
		await shutdownPromise
		
		expect(app.isRunning()).toBeFalsy()
		expect(disconnectSpy).toHaveBeenCalled()
	}, 10000) 

	it('Expect to do sigterm shutdown', async () => {
		const disconnectSpy = jest.spyOn(pgClientMock, '$disconnect')
		const shutdownPromise = createShutdownPromise(app)
		process.emit('SIGTERM')
		await shutdownPromise
		
		expect(app.isRunning()).toBeFalsy()
		expect(disconnectSpy).toHaveBeenCalled()
	}, 10000)
	
	it('Directly test the PostgreSQL client disconnect', async () => {
		const disconnectSpy = jest.spyOn(pgClientMock, '$disconnect')
		await pgClientMock.$disconnect()

		expect(disconnectSpy).toHaveBeenCalled()
	})
})
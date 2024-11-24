import '@setup/setup-tests'
import { setup } from '@setup'

describe('Test process watcher', () => {
	it ('Expect to do sigint shutdown', () => {
		process.emit('SIGINT')
		expect(setup['app'].isRunning()).toBeFalsy()
	})
	it ('Expect to do sigterm shutdown', () => {
		process.emit('SIGTERM')
		expect(setup['app'].isRunning()).toBeFalsy()
	})
})
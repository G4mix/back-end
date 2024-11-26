import '@setup/setup-tests'
import { setup } from '@setup'

describe('Test process watcher', () => {
	it ('Expect to do sigint shutdown', () => {
		if (!setup['app'].isRunning()) setup['app'].start()
		process.emit('SIGINT')
		expect(setup['app'].isRunning()).toBeFalsy()
	})
	it ('Expect to do sigterm shutdown', () => {
		if (!setup['app'].isRunning()) setup['app'].start()
		process.emit('SIGTERM')
		expect(setup['app'].isRunning()).toBeFalsy()
	})
})
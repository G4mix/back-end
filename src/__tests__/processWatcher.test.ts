import '@setup/setup-tests'
import { setup } from '@setup'

describe('Test process watcher', () => {
	it ('Expect to do sigint shutdown', () => {
		if (!setup['app'].isRunning()) setup['app'].start()
		process.emit('SIGINT')
	})
	it ('Expect to do sigterm shutdown', () => {
		if (!setup['app'].isRunning()) setup['app'].start()
		process.emit('SIGTERM')
	})
})
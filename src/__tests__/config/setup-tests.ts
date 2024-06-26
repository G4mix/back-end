import { PostgresqlClientMock } from '@mocks'
import { container } from '@ioc'
import { Lifecycle } from 'tsyringe'
import { setup } from '@setup'
import { app } from '../..'

beforeAll(async () => {
	container
		.register('PrismaClient', { useClass: PostgresqlClientMock }, { lifecycle: Lifecycle.Singleton })
	setup['app'] = app
})

afterAll(() => {
	jest.fn().mockClear()
	if (setup['app'].isRunning()) setup['app'].stop()
})

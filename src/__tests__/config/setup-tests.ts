import { PostgresqlClientMock, S3ClientMock, SESClientMock } from '@mocks'
import { container } from '@ioc'
import { Lifecycle } from 'tsyringe'
import { setup } from '@setup'
import { app } from '../..'

beforeAll(async () => {
	container
		.register('PostgresqlClient', { useClass: PostgresqlClientMock }, { lifecycle: Lifecycle.Singleton })
	container
		.register('SESClient', { useClass: SESClientMock }, { lifecycle: Lifecycle.Singleton })
	container
		.register('S3Client', { useClass: S3ClientMock }, { lifecycle: Lifecycle.Singleton })
	setup['pg'] = container.resolve<PostgresqlClientMock>('PrismaClient')
	setup['app'] = app
	setup['sesClientMock'] = container.resolve<SESClientMock>('SESClient')
	setup['s3ClientMock'] = container.resolve<S3ClientMock>('S3Client')
})

afterAll(() => {
	jest.fn().mockClear()
	if (setup['app'].isRunning()) setup['app'].stop()
})

beforeEach(async () => {
	if (!setup['app'].isRunning()) setup['app'].start()
	setup['pg']['users'] = []
	setup['sesClientMock'].setType('send').setThrowError(false)
	setup['s3ClientMock'].setType('send').setThrowError(false)
})


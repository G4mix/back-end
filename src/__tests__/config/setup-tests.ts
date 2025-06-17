import { PostgresqlClientMock, S3ClientMock, SESClientMock } from '@mocks'
import { container } from '@ioc'
import { Lifecycle } from 'tsyringe'
import { setup } from '@setup'
import { TestApp } from '../app.test'

beforeAll(async () => {
	container
		.register('PostgresqlClient', { useClass: PostgresqlClientMock }, { lifecycle: Lifecycle.Singleton })
	container
		.register('SESClient', { useClass: SESClientMock }, { lifecycle: Lifecycle.Singleton })
	container
		.register('S3Client', { useClass: S3ClientMock }, { lifecycle: Lifecycle.Singleton })
	setup['pg'] = container.resolve<PostgresqlClientMock>('PostgresqlClient')
	setup['sesClientMock'] = container.resolve<SESClientMock>('SESClient')
	setup['s3ClientMock'] = container.resolve<S3ClientMock>('S3Client')
	
	const app = container.resolve<TestApp>(TestApp)
	setup['app'] = app
})

afterAll(async () => {
	jest.fn().mockClear()
	if (setup['app'].isRunning()) await setup['app'].stop()
})

beforeEach(async () => {
	if (!setup['app'].isRunning()) setup['app'].start()
	setup['pg']['users'] = []
	setup['pg']['userOAuths'] = []
	setup['sesClientMock'].setType('send').setThrowError(false).setStatus('Success')
	setup['s3ClientMock'].setType('send').setThrowError(false).setFileUrl('https://localhost:8081/image.png')
})


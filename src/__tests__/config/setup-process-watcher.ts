import { container } from '@ioc'
import { Lifecycle } from 'tsyringe'
import { App } from '../../config/app'
import { processWatcher } from '../../config/processWatcher'
import { PostgresqlClientMock } from '@mocks'

const app = new App()

export function setupProcessWatcherTests() {
  container.clearInstances()
  container
    .register('PostgresqlClient', { useClass: PostgresqlClientMock }, { lifecycle: Lifecycle.Singleton })
  
  processWatcher(app)
  const resolvedPgClient = container.resolve<PostgresqlClientMock>('PostgresqlClient')
  
  return {
    app,
    pgClientMock: resolvedPgClient
  }
} 
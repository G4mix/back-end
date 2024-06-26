import type { PostgresqlClientMock } from '@mocks'
import type { App } from '@config'

type Setup = {
	pg: PostgresqlClientMock;
	app: App;
}

export const setup: Setup = {} as any
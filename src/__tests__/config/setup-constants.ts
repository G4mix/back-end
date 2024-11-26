import type { PostgresqlClientMock } from '@mocks'
import type { App } from '@config'
import { SESClientMock } from '../mocks/config/sesClientMock';
import { S3ClientMock } from '../mocks/config/s3ClientMock';

type Setup = {
	pg: PostgresqlClientMock;
	sesClientMock: SESClientMock;
	s3ClientMock: S3ClientMock;
	app: App;
	testUser: {
		email: string;
		username: string;
		password: string;
	};
	authHeaders: RequestInit['headers'];
	ipAddress: string;
}

export const setup: Setup = {
	authHeaders: { 'Content-Type': 'application/json' },
	testUser: {
		email: 'testuser@gmail.com',
		username: 'example_user',
		password: 'Password123!'
	},
	ipAddress: '::1',
} as any
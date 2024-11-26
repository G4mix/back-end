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
	updateTestUser: {
    email: string;
    password: string;
    username: string;
    icon: Blob;
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
	updateTestUser: {
		email: 'testando@gmail.com',
		password: 'Password12345!',
		username: 'newTestUser',
		icon: new Blob([new Uint8Array(1)], { type: 'image/png' })
	},
	ipAddress: '::1',
} as any
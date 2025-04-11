import type { PostgresqlClientMock } from '@mocks'
import type { TestApp } from '../app.test';
import { SESClientMock } from '../mocks/config/sesClientMock';
import { S3ClientMock } from '../mocks/config/s3ClientMock';

function generateUniqueId() {
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

type Setup = {
	pg: PostgresqlClientMock;
	sesClientMock: SESClientMock;
	s3ClientMock: S3ClientMock;
	app: TestApp;
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

const uniqueId = generateUniqueId();

export const setup: Setup = {
	authHeaders: { 'Content-Type': 'application/json' },
	testUser: {
		email: `testuser_${uniqueId}@gmail.com`,
		username: `example_user_${uniqueId}`,
		password: 'Password123!'
	},
	updateTestUser: {
		email: `testando_${uniqueId}@gmail.com`,
		password: 'Password12345!',
		username: `newTestUser_${uniqueId}`,
		icon: new Blob([new Uint8Array(1)], { type: 'image/png' })
	},
	ipAddress: '::1',
} as any
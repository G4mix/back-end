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
	OAuthUser: {
		user: {
			email: string;
			username: string;
			password: string;
		},
		provider: string;
		email: string;
	},
	socialLoginRequests: {
		google: {
			getUserData: jest.Mock;
			revokeToken: jest.Mock;
		},
		github: {
			getUserData: jest.Mock;
			getUserPrimaryEmail: jest.Mock;
			revokeToken: jest.Mock;
		},
		linkedin: {
			getUser: jest.Mock;
			revokeToken: jest.Mock;
		}
	},
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
	OAuthUser: {
		user: {
			email: `testando_oauth_${uniqueId}@gmail.com`,
			username: `example_oauth_user_${uniqueId}`,
			password: 'Password123'
		},
		provider: 'google'
	},
	socialLoginRequests: {
		google: {
            getUserData: jest.fn(),
            revokeToken: jest.fn()     
        },
        github: {
            getUserData: jest.fn(),
            getUserPrimaryEmail: jest.fn(),
            revokeToken: jest.fn()
        },
        linkedin: {
            getUser: jest.fn(),
            revokeToken: jest.fn()
        }
	},
	ipAddress: '::1',
} as any
module.exports = {
	displayName: 'Gamix Tests',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/src'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'^@config/(.*)$': '<rootDir>/src/config/$1',
		'^@shared/(.*)$': '<rootDir>/src/shared/$1',
		'^@features/(.*)$': '<rootDir>/src/features/$1',
		'^@test/(.*)$': '<rootDir>/src/test/$1',
		'^@tsoa-build/(.*)$': '<rootDir>/src/tsoa/$1',
		'^@ioc$': '<rootDir>/src/config/ioc.ts'
	},
	setupFilesAfterEnv: ['<rootDir>/src/test/setup/jest.e2e.setup.ts'],
	collectCoverageFrom: [
		'src/**/*.ts',
		'!src/**/*.spec.ts',
		'!src/**/*.e2e-spec.ts',
		'!src/test/**/*.ts',
		'!src/tsoa/**/*.ts'
	],
	coverageDirectory: 'coverage/e2e',
	testTimeout: 30000,
	maxWorkers: 1,
	verbose: true,
	forceExit: true,
	detectOpenHandles: true
}

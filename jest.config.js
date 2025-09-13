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
	setupFilesAfterEnv: ['<rootDir>/src/test/jest.setup.ts'],
	collectCoverageFrom: [
		'src/features/**/*.ts',
		'!src/**/*.spec.ts'
	],
	coverageDirectory: 'coverage',
	testTimeout: 30000,
	maxWorkers: 1,
	verbose: true,
	forceExit: true,
	detectOpenHandles: true
}

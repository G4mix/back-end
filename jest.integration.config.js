module.exports = {
	displayName: 'Integration Tests',
	testMatch: ['<rootDir>/src/**/*.integration.spec.ts'],
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/src'],
	moduleNameMapping: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'^@config/(.*)$': '<rootDir>/src/config/$1',
		'^@shared/(.*)$': '<rootDir>/src/shared/$1',
		'^@features/(.*)$': '<rootDir>/src/features/$1',
		'^@test/(.*)$': '<rootDir>/src/test/$1'
	},
	setupFilesAfterEnv: ['<rootDir>/src/test/setup/jest.setup.ts'],
	collectCoverageFrom: [
		'src/**/*.ts',
		'!src/**/*.spec.ts',
		'!src/**/*.integration.spec.ts',
		'!src/test/**/*',
		'!src/**/*.d.ts'
	],
	coverageDirectory: 'coverage/integration',
	coverageReporters: ['text', 'lcov', 'html'],
	testTimeout: 30000, // 30 segundos para testes de integração
	maxWorkers: 1, // Executa um teste por vez para evitar conflitos de porta
	verbose: true,
	forceExit: true,
	detectOpenHandles: true
}

import { JestConfigWithTsJest, pathsToModuleNameMapper } from 'ts-jest'
import { compilerOptions } from './tsconfig.json'

const jestConfig: JestConfigWithTsJest = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleDirectories: ['node_modules', '<rootDir>/src'],
	modulePaths: [compilerOptions.baseUrl],
	moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
	testRegex: 'src/.*\\.(test|spec)\\.[jt]s$',
	transform: {
		'^.+\\.ts?$': 'ts-jest',
	},
	collectCoverageFrom: [
		'src/**/*.ts',
		'!src/index.ts',
		'!src/**/*.d.ts',
		'!**/node_modules/**',
		'!src/__tests__/**/*.ts',
		'!src/tsoa/**',
		'!src/constants/**',
	],
	coverageDirectory: 'coverage',
	coverageReporters: ['lcov', 'text-summary'],
	setupFilesAfterEnv: ['reflect-metadata'],
}

export default jestConfig
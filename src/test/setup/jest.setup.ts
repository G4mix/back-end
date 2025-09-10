// Setup global para testes de integração
import 'reflect-metadata'

// Configurações globais do Jest
beforeAll(() => {
	// Configurações que devem ser executadas antes de todos os testes
	console.log('🚀 Starting Integration Tests...')
})

afterAll(() => {
	// Limpeza que deve ser executada após todos os testes
	console.log('✅ Integration Tests Completed')
})

// Configurações para cada teste
beforeEach(() => {
	// Limpa console.log para evitar spam nos testes
	jest.spyOn(console, 'log').mockImplementation(() => {})
	jest.spyOn(console, 'warn').mockImplementation(() => {})
	jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
	// Restaura console.log após cada teste
	jest.restoreAllMocks()
})

// Configurações de timeout
jest.setTimeout(30000) // 30 segundos por teste

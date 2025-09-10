export class TestData {
	/**
	 * Gera dados de usuário para teste
	 */
	static createUser(overrides: any = {}) {
		return {
			username: 'testuser',
			email: 'test@example.com',
			password: 'Test123!',
			...overrides
		}
	}

	/**
	 * Gera dados de idea para teste
	 */
	static createIdea(overrides: any = {}) {
		return {
			title: 'Test Idea Title - This is a valid title with enough characters',
			description: 'This is a valid description with enough characters to pass validation. It needs to be at least 50 characters long and less than 700 characters.',
			tags: ['test', 'idea'],
			links: [{ url: 'https://example.com' }],
			...overrides
		}
	}

	/**
	 * Gera dados de comentário para teste
	 */
	static createComment(overrides: any = {}) {
		return {
			ideaId: '123e4567-e89b-12d3-a456-426614174000',
			content: 'This is a test comment',
			...overrides
		}
	}

	/**
	 * Gera dados de link pessoal para teste
	 */
	static createPersonalLink(overrides: any = {}) {
		return {
			url: 'https://github.com/testuser',
			...overrides
		}
	}

	/**
	 * Gera UUIDs para teste
	 */
	static generateUUID(): string {
		return '123e4567-e89b-12d3-a456-426614174000'
	}

	/**
	 * Gera token JWT fake para teste
	 */
	static generateFakeToken(): string {
		return 'fake-jwt-token-for-testing'
	}
}

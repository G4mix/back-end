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

	/**
	 * Gera dados de verificação de email para teste
	 */
	static createVerifyEmailCodeData(overrides: any = {}) {
		return {
			email: 'test@example.com',
			code: '123456',
			...overrides
		}
	}

	/**
	 * Gera dados de recuperação de email para teste
	 */
	static createRecoverEmailData(overrides: any = {}) {
		return {
			email: 'test@example.com',
			...overrides
		}
	}

	/**
	 * Gera dados de mudança de senha para teste
	 */
	static createChangePasswordData(overrides: any = {}) {
		return {
			newPassword: 'NewTest123!',
			...overrides
		}
	}

	/**
	 * Gera dados de refresh token para teste
	 */
	static createRefreshTokenData(overrides: any = {}) {
		return {
			refreshToken: 'fake-refresh-token',
			...overrides
		}
	}

	/**
	 * Gera dados de like para teste
	 */
	static createLikeData(overrides: any = {}) {
		return {
			ideaId: '123e4567-e89b-12d3-a456-426614174000',
			...overrides
		}
	}

	/**
	 * Gera dados de view para teste
	 */
	static createViewData(overrides: any = {}) {
		return {
			ideaId: '123e4567-e89b-12d3-a456-426614174000',
			...overrides
		}
	}

	/**
	 * Gera dados de view em lote para teste
	 */
	static createBulkViewData(overrides: any = {}) {
		return {
			ideas: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
			...overrides
		}
	}
}

import jwt from 'jsonwebtoken'
import { env } from '@config/env'

const JWT_SECRET = env.JWT_SIGNING_KEY_SECRET

export class TestTokens {
	/**
	 * Gera um token JWT válido para testes
	 */
	static generateValidToken(payload: any = {}): string {
		const defaultPayload = {
			sub: 'user-123',
			userProfileId: 'profile-123',
			email: 'test@example.com',
			username: 'testuser',
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hora
			...payload
		}

		return jwt.sign(defaultPayload, JWT_SECRET)
	}

	/**
	 * Gera um token JWT expirado para testes
	 */
	static generateExpiredToken(payload: any = {}): string {
		const defaultPayload = {
			sub: 'user-123',
			userProfileId: 'profile-123',
			email: 'test@example.com',
			username: 'testuser',
			iat: Math.floor(Date.now() / 1000) - (60 * 60), // 1 hora atrás
			exp: Math.floor(Date.now() / 1000) - (30 * 60), // 30 minutos atrás
			...payload
		}

		return jwt.sign(defaultPayload, JWT_SECRET)
	}

	/**
	 * Gera um token JWT inválido para testes
	 */
	static generateInvalidToken(): string {
		return 'invalid-token'
	}
}

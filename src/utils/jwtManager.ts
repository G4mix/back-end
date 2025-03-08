import { EXPIRATION_TIME_TOKEN } from '@constants'
import { env } from '@config'
import jwt from 'jsonwebtoken'

export type Claims = {
	sub: string;
	verifiedEmail?: boolean;
	ipAddress?: string;
	exp?: number;
}

export class JwtManager {
	public static refreshToken(token: string): string {
		return this.generateToken(JwtManager.decode(token))
	}

	public static generateToken({
		sub,
		verifiedEmail,
		expiresIn=EXPIRATION_TIME_TOKEN,
		ipAddress=undefined
	}: Claims & { expiresIn?: number }): string {
		const claims: Claims = { sub, verifiedEmail, ipAddress }
		const token = jwt.sign(claims, env['JWT_SIGNING_KEY_SECRET'], { expiresIn })
		return token
	}

	public static decode(token: string): Claims {
		return jwt.verify(token, env['JWT_SIGNING_KEY_SECRET']) as Claims
	}

	private static getExpFromToken(token: string) {
		return JwtManager.decode(token)['exp']!
	}

	public static isTokenExpiringIn20Minutes(token: string): boolean {
		const timeLeft = JwtManager.getExpFromToken(token) * 1000 - Date.now()
		return timeLeft <= 20 * 60 * 1000
	}
}
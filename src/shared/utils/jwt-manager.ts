import { EXPIRATION_TIME_ACCESS_TOKEN } from '@shared/constants/jwt'
import { env } from '@config/env'
import jwt from 'jsonwebtoken'

export type Claims = {
	sub: string;
	userProfileId: string;
	verifiedEmail?: boolean;
	validRoutes?: { route: string; method: string; }[]
	ipAddress?: string;
	exp?: number;
}

export class JwtManager {
	public static generateToken({
		sub,
		userProfileId,
		verifiedEmail,
		expiresIn=EXPIRATION_TIME_ACCESS_TOKEN,
		ipAddress=undefined,
		validRoutes
	}: Claims & { expiresIn?: number }): string {
		const claims: Claims = { sub, verifiedEmail, userProfileId, ipAddress, validRoutes }
		const token = jwt.sign(claims, env['JWT_SIGNING_KEY_SECRET'], { expiresIn })
		return token
	}

	public static decode(token: string): Claims {
		return jwt.verify(token, env['JWT_SIGNING_KEY_SECRET']) as Claims
	}
}
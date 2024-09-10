import type { Response as ExResponse } from 'express'
import { Claims, JwtManager } from '@utils'
import { sendErrorMessage } from '.'
import { container } from '@ioc'
import { PrismaClient } from '@prisma/client'

export const jwtMiddleware = async ({
	res, token
}: { res: ExResponse; token: string; }): Promise<
	| void
	| Claims
	| ExResponse<unknown, Record<string, unknown>>
> => {
	let claims: Claims
	try {
		claims = JwtManager.decode(token)
	} catch (err) {
		return sendErrorMessage({ res })
	}
		
	const pg = container.resolve<PrismaClient>('PostgresqlClient')
	const user = await pg.user.findUnique({ where: { id: claims['sub'] } })
	if (!user) return sendErrorMessage({ res, message: 'USER_NOT_FOUND' })

	if (JwtManager.isTokenExpiringIn20Minutes(token) && !res.hasHeader('Authorization')) {
		res.appendHeader('Authorization', `Bearer ${JwtManager.refreshToken(token)}`)
	}

	return claims
}
import type { Response as ExResponse, Request as ExRequest } from 'express'
import { Claims, JwtManager } from '@utils'
import { sendErrorMessage } from '.'
import { container } from '@ioc'
import { PrismaClient } from '@prisma/client'

export const jwtMiddleware = async ({
	req, res, token
}: { req: ExRequest; res: ExResponse; token: string; }): Promise<
	| void
	| Claims
	| ExResponse<unknown, Record<string, unknown>>
> => {
	let claims: Claims
	try {
		claims = JwtManager.decode(token)
	} catch (err) {
		return sendErrorMessage({ res, message: 'UNAUTHORIZED' })
	}

	const isAuthorized = claims.validRoutes?.some((validRoute) => req.method === validRoute.method || req.path === validRoute.route)
	if (claims.validRoutes && !isAuthorized) {
		return sendErrorMessage({ res, message: 'UNAUTHORIZED' })
	}

	const pg = container.resolve<PrismaClient>('PostgresqlClient')
	const user = await pg.user.findUnique({ where: { id: claims['sub'] } })
	if (!user) return sendErrorMessage({ res, message: 'USER_NOT_FOUND' })

	return claims
}
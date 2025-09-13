import { ErrorResponse, CommonErrors } from '@shared/utils/error-response'
import * as express from 'express'
import { Claims, JwtManager } from '@shared/utils/jwt-manager'
import { container } from 'tsyringe'
import { PrismaClient } from '@prisma/client'

export async function expressAuthentication(
	req: express.Request
) {
	const res = req.res as express.Response
	const token = req.headers['authorization']?.substring(7)
	console.log('Passou no middleware')

	const sendErrorMessage = (
		res: express.Response,
		commonError: ErrorResponse = CommonErrors.INVALID_TOKEN
	) => res.status(commonError.code).json(commonError)
	
	
	if (token) {
		let claims: Claims
		try {
			claims = JwtManager.decode(token)
		} catch (err) {
			return sendErrorMessage(res, CommonErrors.UNAUTHORIZED)
		}
	
		// Verifica se o token tem rotas válidas definidas (JWT limitado)
		if (claims.validRoutes) {
			const isRouteAllowed = claims.validRoutes.some((validRoute: any) => 
				validRoute.method === req.method && req.path.includes(validRoute.route)
			)
			
			if (!isRouteAllowed) {
				return sendErrorMessage(res, CommonErrors.UNAUTHORIZED)
			}
		}
	
		const pg = container.resolve<PrismaClient>('PostgresqlClient')
		const user = await pg.user.findUnique({ where: { id: claims['sub'] } })
		if (!user) return sendErrorMessage(res, CommonErrors.USER_NOT_FOUND)
	
		// Retorna o usuário completo com a propriedade sub para compatibilidade
		return claims
	}
	return Promise.resolve(sendErrorMessage(res, CommonErrors.UNAUTHORIZED))
}

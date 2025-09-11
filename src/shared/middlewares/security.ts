import { ApiMessage, messages } from '@shared/constants/messages'
import * as express from 'express'
import { Claims, JwtManager } from '@shared/utils/jwt-manager'
import { container } from 'tsyringe'
import { PrismaClient } from '@prisma/client'

export async function expressAuthentication(
	req: express.Request
): Promise<any> {
	const res = req.res as express.Response
	const token = req.headers['authorization']?.substring(7)
	console.log('Passou no middleware')

	if (token) {
		let claims: Claims
		try {
			claims = JwtManager.decode(token)
		} catch (err) {
			return sendErrorMessage({ res, message: 'UNAUTHORIZED' })
		}
	
		// Verificação de validRoutes removida - sistema simplificado
		// No futuro, aqui pode ser implementado controle de permissões por roles/teams
	
		const pg = container.resolve<PrismaClient>('PostgresqlClient')
		console.log('JWT Middleware - Buscando user com ID:', claims['sub'])
		const user = await pg.user.findUnique({ where: { id: claims['sub'] } })
		console.log('JWT Middleware - User encontrado:', user)
		if (!user) return sendErrorMessage({ res, message: 'USER_NOT_FOUND' })
	
		// Retorna o usuário completo com a propriedade sub para compatibilidade
		console.log(claims)
		return claims
	}
	return Promise.resolve(res.status(messages['UNAUTHORIZED']).json({ message: 'UNAUTHORIZED' }))
}

export const sendErrorMessage = ({ res, message='INVALID_TOKEN' }: { res: express.Response; message?: ApiMessage; }) => {
	return res
		.status(messages[message])
		.json({ message })
}

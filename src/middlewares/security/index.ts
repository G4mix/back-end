import { ApiMessage, messages } from '@constants'
import { jwtMiddleware } from './jwt'
import * as express from 'express'

export function expressAuthentication(
	req: express.Request
): Promise<any> {
	const res = req.res as express.Response
	const token = req.headers['authorization']?.substring(7)

	if (token) {
		return jwtMiddleware({ res, token })
	}
	return Promise.resolve(res.status(messages['UNAUTHORIZED']).json({ message: 'UNAUTHORIZED' }))
}

export const sendErrorMessage = ({ res, message='INVALID_TOKEN' }: { res: express.Response; message?: ApiMessage; }) => {
	return res
		.status(messages[message])
		.json({ message })
}

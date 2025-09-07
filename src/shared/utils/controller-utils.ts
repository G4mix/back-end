import { Controller } from 'tsoa'
import { Claims, JwtManager } from './jwt-manager'
import { ApiMessage, messages } from '@shared/constants'

export class ControllerUtils {
	public static getClaimsFromAuthorization(authorization?: string): Partial<Claims> & { message?: ApiMessage; } {
		if (!authorization) return { message: 'TOKEN_NOT_FOUND' }
		try {
			return JwtManager.decode(authorization.substring(7))
		} catch (err) {
			return { message: 'INVALID_TOKEN' }
		}
	}
	public static handleMessage(message: ApiMessage, thisController: Controller) {
		thisController.setStatus(messages[message])
		return { message }
	}
	public static handleResponse(res: any, thisController: Controller) {
		if (typeof res === 'string') {
			thisController.setStatus(messages[res as ApiMessage])
			return { message: res }
		}
		return res
	}
}
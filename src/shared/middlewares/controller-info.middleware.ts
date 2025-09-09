import { Request, Response, NextFunction } from 'express'

/**
 * Middleware para injetar informações do controller no request
 * Necessário para que o SmartDTOMiddleware funcione corretamente
 */
export function injectControllerInfo(controller: any, methodName: string) {
	return (req: Request, _res: Response, next: NextFunction) => {
		req.controller = controller
		req.methodName = methodName
		next()
	}
}

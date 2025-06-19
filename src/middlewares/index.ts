import { Request, Response, NextFunction } from 'express'
import { schemaValidation } from './schemaValidation'
import { expressAuthentication } from './security'


// MIDDLEWARE PARA TRATAMENTO DE ERROS NÃO ESPERADOS (RUNTIME, NETWORK ERRORS, ETC)
export const errorHandler = (err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err)
  }
  
  res.status(500).json({
    message: 'INTERNAL_SERVER_ERROR'
  })
}

export { schemaValidation, expressAuthentication }
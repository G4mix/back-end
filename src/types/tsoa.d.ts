import { type Request } from 'express'
import { Claims } from '@utils'

export interface TsoaRequest extends Request {
	user: Claims;
}
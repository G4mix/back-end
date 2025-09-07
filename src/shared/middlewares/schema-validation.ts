import type {
	Request as ExRequest,
	Response as ExResponse,
	NextFunction
} from 'express'
import type { ZodTypeAny } from 'zod'
import { messages, ApiMessage } from '@shared/constants'

export const schemaValidation = (schema: ZodTypeAny, type: 'body' | 'query' | 'params' = 'body') =>
	async (req: ExRequest, res: ExResponse, next: NextFunction) => {
		const result = schema.safeParse(req[type])
		if (res.headersSent || result.success) return next()
		const issue = result.error.issues[0]
		let message: ApiMessage = issue.message as ApiMessage
		let statusCode = issue.code === 'invalid_type' ? messages[message] : 400
		if (issue.code === 'invalid_union') {
			for (const unionError of issue.unionErrors) {
				for (const error of unionError.errors) {
					if (messages[error.message as ApiMessage]) {
						statusCode = messages[error.message as ApiMessage]
						message = error.message as ApiMessage
					}
				}
			}
		}

		return res.status(statusCode).json({ message })
	}
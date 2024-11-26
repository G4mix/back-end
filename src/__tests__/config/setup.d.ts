import type { ApiMessage } from '@constants'
import { User } from '@prisma/client'

export type URL =
	'/auth/signup' |
	'/auth/signin' |
	'/user' |
	'/like/post' |
	'/like/comment' |
	'/post' |
	`/comment/${string}` |
	`/comment/post/${string}` |
	'/view' |
  '/docs'

export type Body = Partial<User> | string | FormData
export type Method = 'POST' | 'GET' | 'DELETE' | 'PATCH' | 'PUT'
export type HandleMessageProps = { response: Response; message: ApiMessage; }
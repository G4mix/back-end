import type { ApiMessage } from '@constants'

export type URL =
	'/hello-world' |
  '/docs'

export type Body = string | FormData
export type Method = 'POST' | 'GET' | 'DELETE' | 'PATCH' | 'PUT'
export type HandleMessageProps = { response: Response; message: ApiMessage; }
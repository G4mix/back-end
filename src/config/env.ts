import { z } from 'zod'
import 'dotenv/config'

const envSchema = z.object({
	PG_DB_URL: z.string().url(),
	FRONTEND_URL: z.string().url(),
	PORT: z.string()
})

export const env = envSchema.parse(process.env)
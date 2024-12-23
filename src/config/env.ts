import { z } from 'zod'
import 'dotenv/config'

const envSchema = z.object({
	PG_DB_URL: z.string().url(),
	FRONTEND_URL: z.string().url(),
	PORT: z.string(),
	AWS_S3_KEY: z.string(),
	AWS_S3_SECRET: z.string(),
	AWS_SES_KEY: z.string(),
	AWS_SES_SECRET: z.string(),
	PUBLIC_BUCKET_NAME: z.string(),
	PRIVATE_BUCKET_NAME: z.string(),
	NODE_ENV: z.string(),
	JWT_SIGNING_KEY_SECRET: z.string()
})

export const env = envSchema.parse(process.env)
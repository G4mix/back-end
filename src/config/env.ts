import { z } from 'zod'
import 'dotenv/config'

const envSchema = z.object({
	PG_DB_URL: z.string().url(),
	GOOGLE_CLIENT_ID: z.string(),
	GOOGLE_CLIENT_SECRET: z.string(),
	GITHUB_CLIENT_ID: z.string(),
	GITHUB_CLIENT_SECRET: z.string(),
	LINKEDIN_CLIENT_ID: z.string(),
	LINKEDIN_CLIENT_SECRET: z.string(),
	PORT: z.string(),
	AWS_S3_KEY: z.string(),
	AWS_S3_SECRET: z.string(),
	AWS_SES_KEY: z.string(),
	AWS_SES_SECRET: z.string(),
	PUBLIC_BUCKET_NAME: z.string(),
	PRIVATE_BUCKET_NAME: z.string(),
	NODE_ENV: z.string(),
	JWT_SIGNING_KEY_SECRET: z.string(),
	REDIRECT_URL: z.string()
})

export const env = envSchema.parse(process.env)
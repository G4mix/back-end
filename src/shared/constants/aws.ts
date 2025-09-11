import { env } from '@config/env'

export const S3ClientOptions = {
	credentials: {
		accessKeyId: env['AWS_S3_KEY'],
		secretAccessKey: env['AWS_S3_SECRET']
	},
	region: 'us-east-1'
}

export const SESClientOptions = {
	credentials: {
		accessKeyId: env['AWS_SES_KEY'],
		secretAccessKey: env['AWS_SES_SECRET']
	},
	region: 'us-east-1'
}
import { CreateBucketCommand, DeleteObjectsCommand, ListBucketsCommand, PutBucketPolicyCommand, PutObjectCommand, PutPublicAccessBlockCommand, S3Client } from '@aws-sdk/client-s3'
import { inject, injectable, singleton } from 'tsyringe'
import { generateRandomCode } from '@shared/utils/generate-random-code'

@injectable()
@singleton()
export class S3Gateway {
	constructor(@inject('S3Client') private s3: S3Client) {}

	public async uploadFile({
		file, folder
	}: { file: Express.Multer.File; folder: string; }) {
		const key = `${folder}/${generateRandomCode()}-${file.originalname}`
		const command = new PutObjectCommand({
			Bucket: 'gamix-app-prod',
			Key: key,
			Body: file.buffer,
		})
  
		try {
			await this.s3.send(command)
			return { url: `https://gamix-app-prod.s3.amazonaws.com/${key}`, key }
		} catch (err) {
			const errorMessage = (err as Error)?.message
			return errorMessage
		}
	}

	public async deleteFile({ key }: { key: string }) {
		const command = new DeleteObjectsCommand({
			Bucket: 'gamix-app-prod',
			Delete: {
				Objects: [{ Key: key }]
			}
		})

		await this.s3.send(command)
		return { success: true }
	}

	public async createBucket(bucketName: string) {
		const command = new CreateBucketCommand({
			Bucket: bucketName,
		})
  
		try {
			await this.s3.send(command)
			return { success: true }
		} catch (err) {
			const errorMessage = (err as Error)?.message
			return errorMessage
		}
	}

	public async listBuckets() {
		const command = new ListBucketsCommand({})
  
		try {
			const response = await this.s3.send(command)
			return response.Buckets
		} catch (err) {
			const errorMessage = (err as Error)?.message
			return errorMessage
		}
	}

	public async setBucketPolicy(bucketName: string, policy: string) {
		const command = new PutBucketPolicyCommand({
			Bucket: bucketName,
			Policy: policy
		})
  
		try {
			await this.s3.send(command)
			return { success: true }
		} catch (err) {
			const errorMessage = (err as Error)?.message
			return errorMessage
		}
	}

	public async setPublicAccessBlock(bucketName: string) {
		const command = new PutPublicAccessBlockCommand({
			Bucket: bucketName,
			PublicAccessBlockConfiguration: {
				BlockPublicAcls: false,
				BlockPublicPolicy: false,
				IgnorePublicAcls: false,
				RestrictPublicBuckets: false
			}
		})
  
		try {
			await this.s3.send(command)
			return { success: true }
		} catch (err) {
			const errorMessage = (err as Error)?.message
			return errorMessage
		}
	}
}

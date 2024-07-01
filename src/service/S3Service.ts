import { CreateBucketCommand, DeleteObjectsCommand, ListBucketsCommand, PutBucketPolicyCommand, PutObjectCommand, PutPublicAccessBlockCommand, S3Client } from '@aws-sdk/client-s3'
import { inject, injectable, singleton } from 'tsyringe'

@injectable()
@singleton()
export class S3Service {
	constructor(@inject('S3Client') private s3: S3Client) {}

	public async uploadFile(
		bucketName: string,
		key: string,
		file: Buffer
	) {
		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: key,
			Body: file,
		})
  
		try {
			await this.s3.send(command)
			return { fileUrl: `https://${bucketName}.s3.amazonaws.com/${key}` }
		} catch (err) {
			console.error(err)
			const errorMessage = (err as Error)?.message
			return errorMessage
		}
	}

	public async deleteObject(
		bucketName: string,
		keys: string[]
	) {
		const command = new DeleteObjectsCommand({
			Bucket: bucketName,
			Delete: {
				Objects: keys?.map((key) => ({ Key: key })),
			},
		})
  
		try {
			return (await this.s3.send(command)).Deleted ?? []
		} catch (err) {
			console.error(err)
			const errorMessage = (err as Error)?.message
			return errorMessage
		}
	}

	public async initializeBuckets() {
		const buckets = await this.listBuckets()
		if (!('gamix-public' in buckets)) {
			await this.createBucket({ bucketName: 'gamix-public' })
			await this.disablePublicAccess({ bucketName: 'gamix-public' })
			await this.putBucketPolicyAllowGet({ bucketName: 'gamix-public' })
		}
	}

	private async listBuckets() {
		const listBucketsCommand = new ListBucketsCommand({})
		return (await this.s3.send(listBucketsCommand)).Buckets ?? []
	}
  
	private async createBucket({ bucketName }: { bucketName: string }) {
		const createBucketCommand = new CreateBucketCommand({ Bucket: bucketName })
		return await this.s3.send(createBucketCommand)
	}

	private async disablePublicAccess({ bucketName }: { bucketName: string }) {
		const putPublicAccessBlockCommand = new PutPublicAccessBlockCommand({
			Bucket: bucketName,
			PublicAccessBlockConfiguration: {
				BlockPublicAcls: false,
				IgnorePublicAcls: false,
				BlockPublicPolicy: false,
				RestrictPublicBuckets: false
			}
		})
		await this.s3.send(putPublicAccessBlockCommand)
	}

	private putBucketPolicyAllowGet({ bucketName }: { bucketName: string; }) {
		const putBucketPolicyCommand = new PutBucketPolicyCommand({
			Bucket: bucketName,
			Policy: JSON.stringify({
				Version: '2012-10-17',
				Statement: [
					{
						Sid: `Statment-${bucketName}`,
						Effect: 'Allow',
						Principal: '*',
						Action: 's3:GetObject',
						Resource: `arn:aws:s3:::${bucketName}/*`,
					},
				],
			}),
		})
		return this.s3.send(putBucketPolicyCommand)
	}
}
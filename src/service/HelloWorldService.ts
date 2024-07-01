import { HelloWorldRepository } from '@repository'
import { injectable, singleton } from 'tsyringe'
import { S3Service } from '@service/S3Service'

@injectable()
@singleton()
export class HelloWorldService {
	constructor(private helloWorldRepository: HelloWorldRepository, private s3Service: S3Service) {}

	public async hello(): Promise<string> {
		await this.s3Service.initializeBuckets()
		return await this.helloWorldRepository.hello()
	}
}
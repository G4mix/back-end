import { HelloWorldRepository } from '@repository'
import { injectable, singleton } from 'tsyringe'

@injectable()
@singleton()
export class HelloWorldService {
	constructor(private helloWorldRepository: HelloWorldRepository) {}

	public async hello(): Promise<string> {
		return await this.helloWorldRepository.hello()
	}
}
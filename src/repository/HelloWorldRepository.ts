import { injectable, singleton } from 'tsyringe'

@injectable()
@singleton()
export class HelloWorldRepository {
	constructor() {}

	public async hello() {
		return 'Hello world'
	}
}
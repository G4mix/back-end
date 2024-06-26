import { Route, Tags, Controller, SuccessResponse, Get } from 'tsoa'
import { HelloWorldService } from '@service'
import { injectable } from 'tsyringe'

@injectable()
@Route('api/v1/hello-world')
@Tags('Hello World')
export class HelloWorldController extends Controller {
	constructor(private helloWorldServiceService: HelloWorldService) {
		super()
	}

	/**
	 * Hello world message
	 *
	 */
	@SuccessResponse(200)
	@Get()
	public async helloWorld() {
		return await this.helloWorldServiceService.hello()
	}
}
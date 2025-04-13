import { injectable, singleton } from 'tsyringe'
import { ViewRepository } from '@repository'

@injectable()
@singleton()
export class ViewService {
	constructor(
		private viewRepository: ViewRepository
	) {}

	public async viewPosts({ userProfileId, posts }: { userProfileId: string; posts: string[]; }) {
		return await this.viewRepository.createMany({ userProfileId, posts })
	}
}
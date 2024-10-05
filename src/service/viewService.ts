import { injectable, singleton } from 'tsyringe'
import { ViewRepository } from '@repository'

@injectable()
@singleton()
export class ViewService {
	constructor(
		private viewRepository: ViewRepository
	) {}

	public async viewPost({ userProfileId, postId }: { userProfileId: string; postId: string; }) {
		const postHasBeenViewed = await this.viewRepository.existsByPostIdAndUserProfileUserId({
			userProfileId, postId
		})
		if (postHasBeenViewed) return postHasBeenViewed
		return await this.viewRepository.create({ userProfileId, postId })
	}
}
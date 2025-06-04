import { injectable, singleton } from 'tsyringe'
import { FollowRepository } from '@repository'

@injectable()
@singleton()
export class FollowService {
	constructor(
		private followRepository: FollowRepository
	) {}

	public async unfollow({ userId, followingTeamId, followingUserId }: { userId: string; followingTeamId?: string; followingUserId?: string; }) {
		return await this.followRepository.unfollow({ followerUserId: userId, followingTeamId, followingUserId })
	}

	public async follow({ userId, followingTeamId, followingUserId }: { userId: string; followingTeamId?: string; followingUserId?: string; }) {
		return await this.followRepository.follow({ followerUserId: userId, followingTeamId, followingUserId })
	}

	public async findAll({ page, quantity, userId, followType }: { userId: string; page: number; quantity: number; followType: 'followers:user' | 'followers:team' | 'following' }) {
		return await this.followRepository.findAll({ page, quantity, userId, followType, targetId: userId })
	}
}
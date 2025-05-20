import { injectable, singleton } from 'tsyringe'
import { LikeRepository } from '@repository'

@injectable()
@singleton()
export class LikeService {
	constructor(
        private likeRepository: LikeRepository
	) {}

	public async likePost({
		userProfileId, postId, isLiked
	}: { userProfileId: string; postId: string; isLiked: boolean; }) {
		const userHasLikedPost = await this.likeRepository.userHasLikedPost({ postId, userProfileId })
		if (isLiked) {
			if (userHasLikedPost) return
			return await this.likeRepository.create({ postId, userProfileId })
		}
		if (!userHasLikedPost) return
		return await this.likeRepository.delete({ id: userHasLikedPost.id })
	}

	public async likeComment({
		userProfileId, commentId, isLiked
	}: { userProfileId: string; commentId: string; isLiked: boolean; }) {
		const userHasLikedPost = await this.likeRepository.userHasLikedComment({ commentId, userProfileId })
		if (isLiked) {
			if (userHasLikedPost) return
			return await this.likeRepository.create({ commentId, userProfileId })
		}
		if (!userHasLikedPost) return
		return await this.likeRepository.delete({ id: userHasLikedPost.id })
	}
}
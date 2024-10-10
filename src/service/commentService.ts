import { injectable, singleton } from 'tsyringe'
import { CommentRepository } from '@repository'

@injectable()
@singleton()
export class CommentService {
	constructor(
        private commentRepository: CommentRepository
	) {}
	public async commentPost({
		userProfileId, postId, content
	}: { userProfileId: string; postId: string; content: string; }) {
		return await this.commentRepository.create({
			postId,
			userProfileId,
			content
		})
	}

	public async replyComment({
		userProfileId, commentId, content
	}: { userProfileId: string; commentId: string; content: string; }) {
		return await this.commentRepository.create({
			commentId,
			userProfileId,
			content
		})
	}

	public async listComments({
		postId, page, quantity
	}: { postId: string; page: number; quantity: number; }) {
		return await this.commentRepository.findAll({
			postId,
			page,
			quantity
		})
	}

	public async listReplies({
		commentId, page, quantity
	}: { commentId: string; page: number; quantity: number; }) {
		return await this.commentRepository.findAll({
			commentId,
			page,
			quantity
		})
	}
}
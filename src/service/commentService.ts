import { injectable, singleton } from 'tsyringe'
import { CommentRepository } from '@repository'

@injectable()
@singleton()
export class CommentService {
	constructor(
        private commentRepository: CommentRepository
	) {}
	public async comment({
		userProfileId, postId, content, commentId
	}: { userProfileId: string; postId: string; commentId?: string; content: string; }) {
		return await this.commentRepository.create({
			postId,
			commentId,
			userProfileId,
			content
		})
	}

	public async listComments({
		postId, commentId, page, quantity, since, userProfileId
	}: { postId: string; userProfileId: string; commentId?: string; page: number; quantity: number; since: string; }) {
		return await this.commentRepository.findAll({
			postId,
			commentId,
			page,
			quantity,
			since,
			userProfileId
		})
	}

	public async findCommentById({
		commentId, userProfileId
	}: { commentId: string; userProfileId: string; }) {
		return await this.commentRepository.findCommentById({
			commentId,
			userProfileId
		})
	}
}
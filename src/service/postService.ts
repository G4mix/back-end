import { injectable, singleton } from 'tsyringe'
import { PostRepository } from '@repository'

@injectable()
@singleton()
export class PostService {
	constructor(
        private postRepository: PostRepository
	) {}

	public async createPost({
		title, content, links, tags, images
	}: {
		title: string;
		content: string;
		links: string[];
		tags: string[];
		images?: Express.Multer.File[];
	}) {
		return await this.postRepository.create({ page, quantity, userProfileId })
	}

	public async findAllPosts({ page, quantity, userProfileId }: { page: number; quantity: number; userProfileId?: string; }) {
		return await this.postRepository.findAll({ page, quantity, userProfileId })
	}

	public async findPostById({ postId: id }: { postId: string; }) {
		return await this.postRepository.findById({ id }) ?? 'POST_NOT_FOUND'
	}

	public async deletePost({
		userProfileId, postId: id
	}: { userProfileId: string; postId: string; }) {
		const post = await this.postRepository.findById({ id })
		if (!post) return 'POST_NOT_FOUND'
		if (post.authorId !== userProfileId) return 'THIS_POST_BELONG_TO_ANOTHER_USER'
		return await this.postRepository.delete({ id })
	}
}
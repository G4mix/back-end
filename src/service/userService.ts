import { injectable, singleton } from 'tsyringe'
import { UserRepository } from '@repository'
import { BCryptEncoder, JwtManager } from '@utils'

@injectable()
@singleton()
export class UserService {
	constructor(
		private userRepository: UserRepository,
	) {}

	public async update(data: { id: string; username?: string; email?: string; password?: string; }) {
		if (data.password) data.password = BCryptEncoder.encode(data.password)
		const user = await this.userRepository.update(data)
		return { token: JwtManager.generateToken({ sub: user.id, user }) }
	}

	public async delete({ id }: { id: string; }) {
		return await this.userRepository.delete({ id })
	}
}
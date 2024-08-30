import { JwtManager, BCryptEncoder } from '@utils'
import { injectable, singleton } from 'tsyringe'
import { UserRepository } from '@repository'
import { AuthInput } from 'auth'
import { EmailStatus, SESService } from './sESService'
import { User } from '@prisma/client'

@injectable()
@singleton()
export class AuthService {
	constructor(
		private userRepository: UserRepository,
		private sesService: SESService
	) {}

	public async signup({ email, password, username }: AuthInput) {
		const user = await this.userRepository.findByEmail({ email })
		if (user) return 'USER_ALREADY_EXISTS'

		const sendedEmail = await this.sesService.verifyIdentity({ receiver: email })
		if (typeof sendedEmail === 'string') return sendedEmail

		const createdUser = await this.userRepository.create({
			password: BCryptEncoder.encode(password),
			username,
			email
		})

		return {
			token: JwtManager.generateToken({
				sub: createdUser.id,
				user: createdUser
			})
		}
	}

	public async signin() {
	// public async signin({ email, password }: { email: string; password: string; }) {
		// const user = await this.userRepository.findByEmail({ email })
		// if (!user) return 'USER_NOT_FOUND'

	}

	public async verifyEmail() {}

	public async forgetPassword() {}

	public async recoverPassword() {}

	private async handleUserNotVerified({ email, id }: User) {
		const res = await this.sesService.checkEmailStatus(email)
		if (typeof res === 'string') return res
		if (res.status === 'Success') return await this.handleVerifiedInSES({ id })
		return await this.handleNotVerifiedInSES({ email, status: res.status as EmailStatus })
	}

	private async handleVerifiedInSES({ id }: { id: string }) {
		const user = await this.userRepository.update({ id, verified: true })
		await this.sesService.sendEmail({ template: 'SignUp', receiver: user.email })
		return user
	}

	private async handleNotVerifiedInSES({ status, email }: { status: EmailStatus; email: string; }) {
		if (status === 'Pending') return 'NEED_TO_VERIFY'
		const verified = await this.sesService.verifyIdentity({ receiver: email })
		if (typeof verified === 'string') return verified
		return 'SENT_AGAIN_NEED_TO_VERIFY'
	}
}
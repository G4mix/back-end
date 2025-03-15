import { EXPIRATION_TIME_REFRESH_TOKEN } from '@constants'
import { JwtManager, BCryptEncoder } from '@utils'
import { injectable, singleton } from 'tsyringe'
import { UserRepository } from '@repository'
import { AuthInput } from 'auth'
import { SESService } from './sesService'
import { ApiMessage } from '@constants'

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

		const data = {
			accessToken: JwtManager.generateToken({
				sub: createdUser.id
			}),
			refreshToken: JwtManager.generateToken({
				sub: createdUser.id,
				expiresIn: EXPIRATION_TIME_REFRESH_TOKEN
			}),
			user: createdUser
		}

		await this.userRepository.update({ token: data.refreshToken })

		return data
	}

	public async signin({ email, password }: { email: string; password: string; }) {
		let user = await this.userRepository.findByEmail({ email })
		if (!user) return 'USER_NOT_FOUND'
		if (!user.verified) {
			const res = await this.sesService.checkEmailStatus(email)
			if (typeof res === 'object' && res.status === 'Success') {
				user = await this.userRepository.update({ id: user.id, verified: true })
				await this.sesService.sendEmail({ template: 'SignUp', receiver: user.email })
			}
		}

		const now = new Date()

		let attempts = user.loginAttempts
		const moreThanFiveAttempts = user.loginAttempts >= 5
		const blockedByTime = (user.blockedUntil != null && user.blockedUntil.getTime() > now.getTime())

		if (moreThanFiveAttempts) {
			if (blockedByTime) return 'EXCESSIVE_LOGIN_ATTEMPTS'
			attempts = 0
			await this.userRepository.update({ id: user.id, loginAttempts: attempts })
		}
		

		if (!BCryptEncoder.compare(password, user.password)) {
			attempts++
			await this.userRepository.update({
				loginAttempts: attempts,
				email,
				id: user.id,
				blockedUntil: attempts === 5 ? new Date(now.getTime() + 30 * 60 * 1000) : null
			})
			if (attempts === 5) {
				// const sended = await this.sesService.sendEmail({
				// 	template: 'BlockedAccount',
				// 	receiver: email,
				// 	token: JwtManager.generateToken({ sub: user.id, verifiedEmail: true, ipAddress: ip }),
				// 	ipAddress: ip
				// })
				// if (typeof sended === 'string') return sended
			}
			const possibleErrors: ApiMessage[] = [
				'WRONG_PASSWORD_ONCE',
				'WRONG_PASSWORD_TWICE',
				'WRONG_PASSWORD_THREE_TIMES',
				'WRONG_PASSWORD_FOUR_TIMES',
				'WRONG_PASSWORD_FIVE_TIMES',
			]
			return possibleErrors[attempts - 1]
		}
		user = await this.userRepository.update({ id: user.id, loginAttempts: 0 })
		return {
			accessToken: JwtManager.generateToken({
				sub: user.id
			}),
			refreshToken: JwtManager.generateToken({
				sub: user.id,
				expiresIn: EXPIRATION_TIME_REFRESH_TOKEN
			}),
			user
		}
	}

	public async refreshToken({ token }: { token: string; }) {
		let id
		try {
			id = JwtManager.decode(token).sub
		} catch (err) {
			return 'UNAUTHORIZED'
		}
		
		const user = await this.userRepository.findById({ id })
		if (!user) return 'USER_NOT_FOUND'

		const data = {
			accessToken: JwtManager.generateToken({
				sub: user.id
			}),
			refreshToken: JwtManager.generateToken({
				sub: user.id,
				expiresIn: EXPIRATION_TIME_REFRESH_TOKEN
			})
		}

		await this.userRepository.update({ token: data.refreshToken })

		return data
	}
}
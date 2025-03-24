import { EXPIRATION_TIME_REFRESH_TOKEN } from '@constants'
import { JwtManager, BCryptEncoder, generateRandomPassword, socialLoginRequests } from '@utils'
import { injectable, singleton } from 'tsyringe'
import { UserRepository } from '@repository'
import { AuthInput } from 'auth'
import { SESService } from './sesService'
import { ApiMessage } from '@constants'
import { serializeUser } from '@serializers'

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
				sub: createdUser.id,
				userProfileId: createdUser.userProfileId
			}),
			refreshToken: JwtManager.generateToken({
				sub: createdUser.id,
				userProfileId: createdUser.userProfileId,
				expiresIn: EXPIRATION_TIME_REFRESH_TOKEN
			}),
			user: serializeUser(createdUser)
		}

		await this.userRepository.update({ id: createdUser.id, token: data.refreshToken })

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

		const data = {
			accessToken: JwtManager.generateToken({
				sub: user.id,
				userProfileId: user.userProfileId
			}),
			refreshToken: JwtManager.generateToken({
				sub: user.id,
				userProfileId: user.userProfileId,
				expiresIn: EXPIRATION_TIME_REFRESH_TOKEN
			}),
			user: serializeUser(user)
		}

		user = await this.userRepository.update({ id: user.id, loginAttempts: 0, token: data.refreshToken })

		return data
	}

	public async handleCallbackUrl({ provider, code, codeVerifier }: { provider: 'google' | 'github' | 'linkedin'; code?: string; codeVerifier?: string; }) {
		const { google, github, linkedin } = socialLoginRequests
		console.log(code, provider, codeVerifier)
		if (!code) return null

		const providers = {
			google: async () => codeVerifier ? google.getToken({ code, codeVerifier }) : null,
			linkedin: async () => linkedin.getToken({ code }),
			github: async () => github.getToken({ code })
		}

		const executeSocialLogin = providers[provider]
		if (!executeSocialLogin) return null

		try {
			return executeSocialLogin()
		} catch (err) {
			console.log(err)
			return null
		}
	}

	public async socialLogin({ provider, token }: { provider: 'google' | 'github' | 'linkedin'; token: string; }) {
		const providers = this.getProviders({ token })
		const executeSocialLogin = providers[provider]
		if (!executeSocialLogin) return 'PROVIDER_NOT_FOUND'

		let userData: { email: string; name: string; } | null
		try {
			userData = await executeSocialLogin()
		} catch (err) {
			userData = null
		}
		if (!userData) return 'USER_NOT_FOUND'

		let oauthUser = await this.userRepository.findOAuthUser({ provider, email: userData.email })
		if (!oauthUser) {
			let user = await this.userRepository.findByEmail({ email: userData.email })
			if (user) return 'PROVIDER_NOT_LINKED'

			user = await this.userRepository.create({
				username: userData.name,
				email: userData.email,
				password: BCryptEncoder.encode(generateRandomPassword())
			})
			oauthUser = await this.userRepository.linkOAuthProvider({
				userId: user.id,
				provider,
				email: userData.email
			})
		}

		const data = {
			accessToken: JwtManager.generateToken({
				sub: oauthUser.user.id,
				userProfileId: oauthUser.user.userProfileId
			}),
			refreshToken: JwtManager.generateToken({
				sub: oauthUser.user.id,
				userProfileId: oauthUser.user.userProfileId,
				expiresIn: EXPIRATION_TIME_REFRESH_TOKEN
			}),
			user: serializeUser(oauthUser.user)
		}

		await this.userRepository.update({ id: oauthUser.user.id, token: data.refreshToken })

		return data
	}

	public async linkNewOAuthProvider({ userId, provider, token }: { userId: string; provider: 'google' | 'github' | 'linkedin'; token: string; }) {
		const providers = this.getProviders({ token })
		const executeSocialLogin = providers[provider]
		if (!executeSocialLogin) return 'PROVIDER_NOT_FOUND'

		let userData: { email: string; name: string; } | null
		try {
			userData = await executeSocialLogin()
		} catch (err) {
			userData = null
		}
		if (!userData) return 'USER_NOT_FOUND'

		const user = await this.userRepository.findById({ id: userId })
		if (!user) return 'USER_NOT_FOUND'

		const existingLink = await this.userRepository.findOAuthUser({ provider, email: userData.email })
		if (existingLink) return 'PROVIDER_ALREADY_LINKED'

		await this.userRepository.linkOAuthProvider({ userId, provider, email: userData.email })

		return { success: true }
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
				sub: user.id,
				userProfileId: user.userProfileId
			}),
			refreshToken: JwtManager.generateToken({
				sub: user.id,
				userProfileId: user.userProfileId,
				expiresIn: EXPIRATION_TIME_REFRESH_TOKEN
			})
		}

		await this.userRepository.update({ id: user.id, token: data.refreshToken })

		return data
	}

	private getProviders({ token }: { token: string; }) {
		const { google, github, linkedin } = socialLoginRequests

		return {
			'google': async () => {
				const user = await google.getUserData({ token })
				await google.revokeToken({ token })
				return { name: user.name, email: user.email }
			},
			'github': async () => {
				const user = await github.getUserData({ token })
				const primaryEmail = await github.getUserPrimaryEmail({ token })
				await github.revokeToken({ token })
				return { name: user.name, email: primaryEmail || null }
			},
			'linkedin': async () => {
				const user = await linkedin.getUser({ token })
				await linkedin.revokeToken({ token })
				return { name: user.name, email: user.email }
			}
		}
	}
}
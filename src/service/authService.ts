import { EXPIRATION_TIME_REFRESH_TOKEN } from '@constants'
import { JwtManager, BCryptEncoder, generateRandomPassword } from '@utils'
import { injectable, singleton } from 'tsyringe'
import { UserRepository } from '@repository'
import { AuthInput } from 'auth'
import { SESService } from './sesService'
import { ApiMessage } from '@constants'
import { serializeUser } from '@serializers'
import { env } from '@config'

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

	public async socialLogin({ provider, code, codeVerifier }: { provider: 'google' | 'github' | 'linkedin'; code: string; codeVerifier?: string; }) {
		const providers = {
			'google': async () => {
				try {
					if (!codeVerifier) return null
					const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded',
						},
						body: new URLSearchParams({
							client_id: env.GOOGLE_CLIENT_ID,
							client_secret: env.GOOGLE_CLIENT_SECRET,
							code,
							codeVerifier,
							redirect_uri: `${env.REDIRECT_URL}/api/v1/auth/callback/google`,
							grant_type: 'authorization_code'
						}).toString(),
					})

					const token = (await tokenRes.json() as any).access_token
					const userDataRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
						headers: { Authorization: `Bearer ${token}` }
					})
					const user = await userDataRes.json() as any
					return { name: user.name, email: user.email }
				} catch (err) {
					return null
				}
			},
			'github': async () => {
				try {
					const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Accept': 'application/json'
						},
						body: JSON.stringify({
							client_id: env.GITHUB_CLIENT_ID,
							client_secret: env.GITHUB_CLIENT_SECRET,
							code,
							redirect_uri: `${env.REDIRECT_URL}/api/v1/auth/callback/github`
						}).toString(),
					})

					const token = (await tokenRes.json() as any).access_token

					const userRes = await fetch('https://api.github.com/user', {
						headers: {
							'Accept': 'application/json',
							'Authorization': `Bearer ${token}`
						},
					})

					const user = await userRes.json() as any

					const emailRes = await fetch('https://api.github.com/user/emails', {
						headers: {
							'Accept': 'application/json',
							'Authorization': `Bearer ${token}`
						},
					})

					const emails = await emailRes.json() as any

					const primaryEmail = emails.find((email: any) => email.primary && email.verified)?.email

					return { name: user.name, email: primaryEmail || null }
				} catch (err) {
					return null
				}
			},
			'linkedin': async () => {
				try {
					const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded',
						},
						body: new URLSearchParams({
							grant_type: 'authorization_code',
							code,
							client_id: env.LINKEDIN_CLIENT_ID,
							client_secret: env.LINKEDIN_CLIENT_SECRET,
							redirect_uri: `${env.REDIRECT_URL}/api/v1/auth/callback/linkedin`
						}).toString()
					})

					const token = (await tokenRes.json() as any).access_token
					const userDataRes = await fetch('https://api.linkedin.com/v2/userinfo', {
						headers: { Authorization: `Bearer ${token}` }
					})
					const user = await userDataRes.json() as any
					console.log(user)
					return { name: user.name, email: user.email }
				} catch (err) {
					return null
				}
			}
		}

		const executeSocialLogin = providers[provider]
		if (!executeSocialLogin) return 'PROVIDER_NOT_FOUND'

		const userData = await executeSocialLogin() as { email: string; name: string; }
		if (!userData) return 'USER_NOT_FOUND'

		let user = await this.userRepository.findByEmail({ email: userData.email })
		if (!user) {
			user = await this.userRepository.create({ username: userData.name, email: userData.email, password: BCryptEncoder.encode(generateRandomPassword()) })
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

		await this.userRepository.update({ id: user.id, token: data.refreshToken })

		return data
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
}
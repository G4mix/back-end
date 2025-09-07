import { injectable, singleton } from 'tsyringe'
import { socialLoginRequests } from '@shared/utils'

@injectable()
@singleton()
export class AuthGateway {
	constructor() {}

	async validateSocialLogin({ provider, token }: { provider: string; token: string }): Promise<{ valid: boolean; userData?: any }> {
		try {
			const userData = await this.getSocialUserData({ provider, token })
			return { valid: true, userData }
		} catch (error) {
			console.error('Social login validation failed:', error)
			return { valid: false }
		}
	}

	private async getSocialUserData({ provider, token }: { provider: string; token: string }) {
		switch (provider) {
		case 'google':
			return await this.validateGoogleToken(token)
		case 'github':
			return await this.validateGithubToken(token)
		case 'linkedin':
			return await this.validateLinkedinToken(token)
		default:
			throw new Error('UNSUPPORTED_PROVIDER')
		}
	}

	private async validateGoogleToken(token: string) {
		const { google } = socialLoginRequests
		const user = await google.getUserData({ token })
		await google.revokeToken({ token })
		return { name: user.name, email: user.email }
	}

	private async validateGithubToken(token: string) {
		const { github } = socialLoginRequests
		const user = await github.getUserData({ token })
		const primaryEmail = await github.getUserPrimaryEmail({ token })
		await github.revokeToken({ token })
		return { name: user.name || user.login, email: primaryEmail || null }
	}

	private async validateLinkedinToken(token: string) {
		const { linkedin } = socialLoginRequests
		const user = await linkedin.getUser({ token })
		await linkedin.revokeToken({ token })
		return { name: user.name, email: user.email }
	}

}

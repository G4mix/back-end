import { injectable, singleton } from 'tsyringe'
import { socialLoginRequests } from '@shared/utils/social-login-requests'

@injectable()
@singleton()
export class AuthGateway {
	constructor() {}

	async validateSocialLogin({ provider, token }: { provider: string; token: string }): Promise<{ valid: boolean; userData?: any }> {
		const providers = {
			google: () => this.validateGoogleToken(token),
			github: () => this.validateGithubToken(token),
			linkedin: () => this.validateLinkedinToken(token)
		}
		const executeSocialLogin = providers[provider as keyof typeof providers]
		if (!executeSocialLogin) return { valid: false }

		try {
			const userData = await executeSocialLogin()
			return { valid: true, userData }
		} catch (error) {
			console.error('Social login validation failed:', error)
			return { valid: false }
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

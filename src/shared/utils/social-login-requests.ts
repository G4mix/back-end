import { env } from '@config/env'

export const socialLoginRequests = {
	google: {
		getToken: async ({ code, codeVerifier }: { code: string; codeVerifier: string; }) => {
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
					redirect_uri: `${env.REDIRECT_URL}/v1/auth/callback/google`,
					grant_type: 'authorization_code'
				} as any).toString(),
			})
      
			return (await tokenRes.json() as any).access_token
		},
		getUserData: async ({ token }: { token: string; }) => {
			const userDataRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
				headers: { Authorization: `Bearer ${token}` }
			})
			return await userDataRes.json() as any
		},
		revokeToken: async ({ token }: { token: string; }) => {
			try {
				return fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
					method: 'POST',
					headers: { 'Content-type': 'application/x-www-form-urlencoded' }
				})
			} catch (err) {
				return
			}
		}
	},
	github: {
		getToken: async ({ code }: { code: string; }) => {
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
					redirect_uri: `${env.REDIRECT_URL}/v1/auth/callback/github`
				}).toString(),
			})
      
			return (await tokenRes.json() as any).access_token
		},
		revokeToken: async ({ token }: { token: string; }) => {
			try {
				return fetch(`https://api.github.com/applications/${env.GITHUB_CLIENT_ID}/token`, {
					method: 'DELETE',
					headers: {
						'Accept': 'application/vnd.github+json',
						'X-GitHub-Api-Version': '2022-11-28',
						'Authorization': `Basic ${btoa(`${env.GITHUB_CLIENT_ID}:${env.GITHUB_CLIENT_SECRET}`)}`
					},
					body: JSON.stringify({ access_token: token })
				})
			} catch (err) {
				return
			}
		},
		getUserData: async ({ token }: { token: string; }) => {
			const userRes = await fetch('https://api.github.com/user', {
				headers: {
					'Accept': 'application/json',
					'Authorization': `Bearer ${token}`
				},
			})

			return await userRes.json() as any
		},
		getUserPrimaryEmail: async ({ token }: { token: string; }) => {
			const emailRes = await fetch('https://api.github.com/user/emails', {
				headers: {
					'Accept': 'application/json',
					'Authorization': `Bearer ${token}`
				},
			})

			const emails = await emailRes.json() as any

			return emails.find((email: any) => email.primary && email.verified)?.email
		}
	},
	linkedin: {
		getToken: async ({ code }: { code: string; }) => {
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
					redirect_uri: `${env.REDIRECT_URL}/v1/auth/callback/linkedin`
				} as any).toString()
			})
      
			return (await tokenRes.json() as any).access_token
		},
		revokeToken: async ({ token }: { token: string; }) => {
			try {
				return fetch('https://www.linkedin.com/oauth/v2/revoke', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: new URLSearchParams({
						client_id: env.LINKEDIN_CLIENT_ID,
						client_secret: env.LINKEDIN_CLIENT_SECRET,
						token
					} as any).toString()
				})
			} catch (err) {
				return
			}
		},
		getUser: async ({ token }: { token: string; }) => {
			const userDataRes = await fetch('https://api.linkedin.com/v2/userinfo', {
				headers: { Authorization: `Bearer ${token}` }
			})
			return await userDataRes.json() as any
		}
	}
}
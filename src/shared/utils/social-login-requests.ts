import { env } from '@config/env'
import axios from 'axios'

export const socialLoginRequests = {
	google: {
		getToken: async ({ code, codeVerifier }: { code: string; codeVerifier: string; }) => {
			const tokenRes = await axios.post('https://oauth2.googleapis.com/token', 
				new URLSearchParams({
					client_id: env.GOOGLE_CLIENT_ID,
					client_secret: env.GOOGLE_CLIENT_SECRET,
					code,
					codeVerifier,
					redirect_uri: `${env.REDIRECT_URL}/v1/auth/callback/google`,
					grant_type: 'authorization_code'
				} as any).toString(),
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					}
				}
			)
      
			return tokenRes.data.access_token
		},
		getUserData: async ({ token }: { token: string; }) => {
			const userDataRes = await axios.get('https://www.googleapis.com/userinfo/v2/me', {
				headers: { Authorization: `Bearer ${token}` }
			})
			return userDataRes.data
		},
		revokeToken: async ({ token }: { token: string; }) => {
			try {
				return axios.post(`https://oauth2.googleapis.com/revoke?token=${token}`, null, {
					headers: { 'Content-type': 'application/x-www-form-urlencoded' }
				})
			} catch (err) {
				return
			}
		}
	},
	github: {
		getToken: async ({ code }: { code: string; }) => {
			const tokenRes = await axios.post('https://github.com/login/oauth/access_token', {
				client_id: env.GITHUB_CLIENT_ID,
				client_secret: env.GITHUB_CLIENT_SECRET,
				code,
				redirect_uri: `${env.REDIRECT_URL}/v1/auth/callback/github`
			}, {
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				}
			})
      
			return tokenRes.data.access_token
		},
		revokeToken: async ({ token }: { token: string; }) => {
			try {
				return axios.delete(`https://api.github.com/applications/${env.GITHUB_CLIENT_ID}/token`, {
					headers: {
						'Accept': 'application/vnd.github+json',
						'X-GitHub-Api-Version': '2022-11-28',
						'Authorization': `Basic ${btoa(`${env.GITHUB_CLIENT_ID}:${env.GITHUB_CLIENT_SECRET}`)}`
					},
					data: { access_token: token }
				})
			} catch (err) {
				return
			}
		},
		getUserData: async ({ token }: { token: string; }) => {
			const userRes = await axios.get('https://api.github.com/user', {
				headers: {
					'Accept': 'application/json',
					'Authorization': `Bearer ${token}`
				}
			})

			return userRes.data
		},
		getUserPrimaryEmail: async ({ token }: { token: string; }) => {
			const emailRes = await axios.get('https://api.github.com/user/emails', {
				headers: {
					'Accept': 'application/json',
					'Authorization': `Bearer ${token}`
				}
			})
			console.log(emailRes.data)
			return emailRes.data.find((email: any) => email.primary && email.verified)?.email
		}
	},
	linkedin: {
		getToken: async ({ code }: { code: string; }) => {
			const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', 
				new URLSearchParams({
					grant_type: 'authorization_code',
					code,
					client_id: env.LINKEDIN_CLIENT_ID,
					client_secret: env.LINKEDIN_CLIENT_SECRET,
					redirect_uri: `${env.REDIRECT_URL}/v1/auth/callback/linkedin`
				} as any).toString(),
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					}
				}
			)
      
			return tokenRes.data.access_token
		},
		revokeToken: async ({ token }: { token: string; }) => {
			try {
				return axios.post('https://www.linkedin.com/oauth/v2/revoke', 
					new URLSearchParams({
						client_id: env.LINKEDIN_CLIENT_ID,
						client_secret: env.LINKEDIN_CLIENT_SECRET,
						token
					} as any).toString(),
					{
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded',
						}
					}
				)
			} catch (err) {
				return
			}
		},
		getUser: async ({ token }: { token: string; }) => {
			const userDataRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
				headers: { Authorization: `Bearer ${token}` }
			})
			return userDataRes.data
		}
	}
}
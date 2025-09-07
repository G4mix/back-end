import {
	SESClient,
	SendTemplatedEmailCommand,
	GetIdentityVerificationAttributesCommand,
	VerifyEmailIdentityCommand
} from '@aws-sdk/client-ses'
import { inject, injectable, singleton } from 'tsyringe'

export type Email = {
	template: string;
	receiver: string;
	data?: { [key: string]: string };
}

export type EmailStatus = 'Pending' | 'Success' | 'Failed' | 'TemporaryFailure' | 'NotStarted' | undefined

@injectable()
@singleton()
export class SESGateway {
	constructor(@inject('SESClient') private ses: SESClient) {}

	public async sendEmail(
		{ template, receiver, data }: Email
	): Promise<{ MessageId: string; } | 'ERROR_WHILE_SENDING_EMAIL'> {
		const email = new SendTemplatedEmailCommand({
			Source: 'System - Gamix <gamix.app.prod@gmail.com>',
			Template: template as string,
			ConfigurationSetName: '',
			Destination: {
				ToAddresses: [receiver]
			},
			TemplateData: JSON.stringify(data || {})
		})

		try {
			const response = await this.ses.send(email)
			return { MessageId: response.MessageId! }
		} catch (error) {
			console.error('Error sending email:', error)
			return 'ERROR_WHILE_SENDING_EMAIL'
		}
	}

	public async verifyIdentity({ receiver }: { receiver: string }): Promise<{ MessageId: string; } | 'ERROR_WHILE_VERIFYING_EMAIL'> {
		const command = new VerifyEmailIdentityCommand({
			EmailAddress: receiver
		})

		try {
			await this.ses.send(command)
			return { MessageId: 'verification-sent' }
		} catch (error) {
			console.error('Error verifying email:', error)
			return 'ERROR_WHILE_VERIFYING_EMAIL'
		}
	}

	public async checkEmailStatus(email: string): Promise<{ status: EmailStatus } | 'ERROR_WHILE_CHECKING_EMAIL_STATUS'> {
		const command = new GetIdentityVerificationAttributesCommand({
			Identities: [email]
		})

		try {
			const response = await this.ses.send(command)
			const verificationStatus = response.VerificationAttributes?.[email]?.VerificationStatus
			return { status: verificationStatus as EmailStatus }
		} catch (error) {
			console.error('Error checking email status:', error)
			return 'ERROR_WHILE_CHECKING_EMAIL_STATUS'
		}
	}
}

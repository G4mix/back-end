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
export class SESService {
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
			TemplateData: JSON.stringify(data)
		})
		try {
			const res = await this.ses.send(email)
			return { MessageId: res.MessageId! }
		} catch (err) {
			return 'ERROR_WHILE_SENDING_EMAIL'
		}
	}

	public async verifyIdentity({ receiver }: {
		receiver: string;
	}): Promise<void | 'ERROR_WHILE_CHECKING_EMAIL'> {
		const email = new VerifyEmailIdentityCommand({ EmailAddress: receiver  })
		try {
			await this.ses.send(email)
		} catch (err) {
			return 'ERROR_WHILE_CHECKING_EMAIL'
		}
	}

	public async checkEmailStatus(email: string) {
		const toCheck = new GetIdentityVerificationAttributesCommand({ Identities: [email] })
		try {
			const checked = await this.ses.send(toCheck)
			if (!checked['VerificationAttributes']) return 'NOT_FOUNDED_DATA'
			if (Object.keys(checked['VerificationAttributes']).length === 0) return { status: 'NotStarted' as EmailStatus }
			return { status: checked['VerificationAttributes']![email]!['VerificationStatus']! }
		} catch (err) {
			return 'ERROR_WHILE_CHECKING_EMAIL'
		}
	}
}

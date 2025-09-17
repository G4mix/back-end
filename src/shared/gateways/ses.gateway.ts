import { SESv2Client, CreateEmailIdentityCommand } from '@aws-sdk/client-sesv2';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { getErrorMessage } from '../utils/getErrorMessage';

export const SES_CLIENT = Symbol('SES_CLIENT');

@Injectable()
export class SESGateway {
  private readonly logger = new Logger(this.constructor.name);
  constructor(@Inject(SES_CLIENT) private readonly ses: SESv2Client) {}

  public async verifyIdentity(
    email: string,
  ): Promise<void | { message: string }> {
    const emailIdentity = new CreateEmailIdentityCommand({
      EmailIdentity: email,
    });

    try {
      this.logger.warn(`Verify email sent to: ${email}`);
      await this.ses.send(emailIdentity);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      this.logger.error(`verifyIdentity returns error: ${message}`);
      return { message: 'Error while checking email' };
    }
  }
}

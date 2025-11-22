import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Res,
  Version,
} from '@nestjs/common';
import { type Response } from 'express';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { NotificationGateway } from 'src/shared/gateways/notification.gateway';

@Controller('/notification')
export class StreamNotificationsController {
  readonly logger = new Logger(this.constructor.name);

  constructor(private readonly notificationGateway: NotificationGateway) {}

  @Get('/stream')
  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Protected()
  public async streamNotifications(
    @Headers('authorization') authorization: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const token = authorization?.split(' ')[1] || null;
    await this.notificationGateway.handleConnection(res, token);
  }
}

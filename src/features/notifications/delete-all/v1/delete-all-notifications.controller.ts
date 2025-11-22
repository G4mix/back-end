import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
  Request,
  Version,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from 'src/entities/notification.entity';
import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { Repository } from 'typeorm';

@Controller('/notification')
export class DeleteAllNotificationsController {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Delete()
  @Version('1')
  @Protected()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllNotifications(
    @Request() { user: { userProfileId } }: RequestWithUserData,
  ): Promise<void> {
    await this.notificationRepository.delete({
      userProfileId,
    });
  }
}

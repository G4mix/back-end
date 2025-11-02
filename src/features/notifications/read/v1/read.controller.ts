import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Patch,
  Request,
  Version,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from 'src/entities/notification.entity';
import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { FindOptionsWhere, In, IsNull, Repository } from 'typeorm';
import { ReadNotificationsInput } from './read.dto';

@Controller('/notification')
export class ReadNotificationsController {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Patch('/read')
  @Version('1')
  @Protected()
  @HttpCode(HttpStatus.NO_CONTENT)
  async readNotifications(
    @Request() { user: { userProfileId } }: RequestWithUserData,
    @Body() { notificationIds }: ReadNotificationsInput,
  ): Promise<void> {
    const whereCondition: FindOptionsWhere<Notification> = {
      userProfileId: userProfileId,
      readAt: IsNull(),
    };

    if (notificationIds && notificationIds.length > 0) {
      whereCondition.id = In(notificationIds);
    }

    await this.notificationRepository.update(whereCondition, {
      readAt: new Date(),
    });
  }
}

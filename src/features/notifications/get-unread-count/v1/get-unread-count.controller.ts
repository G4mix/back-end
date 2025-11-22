import {
  Controller,
  Get,
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
import { IsNull, Repository } from 'typeorm';
import { GetUnreadCountOutput } from './get-unread-count.dto';

@Controller('/notification')
export class GetUnreadCountController {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Get('/unread-count')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Protected()
  async getUnreadCount(
    @Request() req: RequestWithUserData,
  ): Promise<GetUnreadCountOutput> {
    const count = await this.notificationRepository.count({
      where: {
        userProfileId: req.user.userProfileId,
        readAt: IsNull(),
      },
    });

    return { count };
  }
}


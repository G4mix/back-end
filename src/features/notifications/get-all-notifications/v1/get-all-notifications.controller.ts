import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
  Request,
  Version,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from 'src/entities/notification.entity';
import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { IsNull, Repository } from 'typeorm';
import {
  GetAllNotificationsInput,
  GetAllNotificationsOutput,
} from './get-all-notifications.dto';

@Controller('/notification')
export class GetAllNotificationsController {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Protected()
  async getAllNotifications(
    @Request() req: RequestWithUserData,
    @Query() { quantity, page }: GetAllNotificationsInput,
  ): Promise<GetAllNotificationsOutput> {
    const qb = this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.actorProfile', 'actorProfile')
      .leftJoinAndSelect('actorProfile.user', 'actorUser')
      .where('notification.userProfileId = :userProfileId', {
        userProfileId: req.user.userProfileId,
      })
      .orderBy('notification.createdAt', 'DESC');

    qb.skip(page * quantity).take(quantity);

    const [notifications, total] = await qb.getManyAndCount();

    const unreadCount = await this.notificationRepository.count({
      where: {
        userProfileId: req.user.userProfileId,
        readAt: IsNull(),
      },
    });

    const pages = Math.ceil(total / quantity);
    const nextPage = page + 1;

    return {
      total,
      pages,
      page,
      nextPage: nextPage >= pages ? null : nextPage,
      unreadCount,
      data: notifications.map((notification) => notification.toDto()),
    };
  }
}

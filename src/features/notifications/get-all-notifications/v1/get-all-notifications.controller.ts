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
import { Repository } from 'typeorm';
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
    @Query() { quantity, page, isRead, type }: GetAllNotificationsInput,
  ): Promise<GetAllNotificationsOutput> {
    const qb = this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.actorProfile', 'actorProfile')
      .leftJoinAndSelect('actorProfile.user', 'actorUser')
      .where('notification.userProfileId = :userProfileId', {
        userProfileId: req.user.userProfileId,
      });

    if (isRead !== undefined) {
      if (isRead) {
        qb.andWhere('notification.readAt IS NOT NULL');
      } else {
        qb.andWhere('notification.readAt IS NULL');
      }
    }

    if (type) {
      qb.andWhere('notification.type = :type', { type });
    }

    qb.orderBy('notification.createdAt', 'DESC');

    qb.skip(page * quantity).take(quantity);

    const [notifications, total] = await qb.getManyAndCount();

    const pages = Math.ceil(total / quantity);
    const nextPage = page + 1;

    return {
      total,
      pages,
      page,
      nextPage: nextPage >= pages ? null : nextPage,
      data: notifications.map((notification) => notification.toDto()),
    };
  }
}

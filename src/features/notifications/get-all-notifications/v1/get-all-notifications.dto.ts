import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import {
  NotificationDto,
  NotificationType,
} from 'src/entities/notification.entity';

export class GetAllNotificationsInput {
  @IsOptional()
  @IsNumber({}, { message: 'INVALID_PAGE' })
  @Min(0, { message: 'INVALID_PAGE' })
  @Type(() => Number)
  page: number = 0;

  @Type(() => Number)
  @IsNumber({}, { message: 'INVALID_QUANTITY' })
  @Min(1, { message: 'INVALID_QUANTITY' })
  @IsOptional()
  quantity: number = 10;

  @IsOptional()
  @IsBoolean({ message: 'INVALID_IS_READ' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isRead?: boolean;

  @IsOptional()
  @IsEnum(NotificationType, { message: 'INVALID_NOTIFICATION_TYPE' })
  type?: NotificationType;
}

export class GetAllNotificationsOutput {
  page: number;
  nextPage: number | null;
  pages: number;
  total: number;
  data: NotificationDto[];
}

import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { NotificationDto } from 'src/entities/notification.entity';

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
}

export class GetAllNotificationsOutput {
  page: number;
  nextPage: number | null;
  pages: number;
  total: number;
  unreadCount: number;
  data: NotificationDto[];
}

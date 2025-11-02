import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class ReadNotificationsInput {
  @IsOptional()
  @IsArray({ message: 'INVALID_NOTIFICATION_IDS' })
  @IsUUID(undefined, { each: true, message: 'INVALID_NOTIFICATION_ID' })
  notificationIds?: string[];
}

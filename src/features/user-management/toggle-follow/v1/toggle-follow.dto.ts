import { IsUUID } from 'class-validator';

export class ToggleFollowInput {
  @IsUUID(undefined, { message: 'INVALID_TARGET_USER_ID' })
  targetUserId: string | undefined;
}

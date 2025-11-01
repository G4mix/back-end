import { IsOptional, IsUUID } from 'class-validator';

export class ToggleFollowInput {
  @IsOptional()
  @IsUUID(undefined, { message: 'INVALID_TARGET_USER_ID' })
  targetUserId: string | undefined;

  @IsOptional()
  @IsUUID(undefined, { message: 'INVALID_TARGET_PROJECT_ID' })
  targetProjectId: string | undefined;
}

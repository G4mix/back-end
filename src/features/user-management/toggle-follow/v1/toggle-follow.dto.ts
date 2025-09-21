import { IsString, IsUUID } from 'class-validator';

export class ToggleFollowInput {
  @IsString({ message: 'O campo "userProfileId" deve ser uma string' })
  @IsUUID()
  targetUserId?: string | undefined;
}

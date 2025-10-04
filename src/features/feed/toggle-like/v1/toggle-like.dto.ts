import { IsEnum, IsString, IsUUID } from 'class-validator';

export enum LikeType {
  IDEA = 'Idea',
  COMMENT = 'Comment',
}

export class ToggleLikeInput {
  @IsString({ message: 'INVALID_TARGET_LIKE_ID' })
  @IsUUID()
  targetLikeId: string | undefined;

  @IsEnum(LikeType, { message: 'INVALID_LIKE_TYPE' })
  likeType: LikeType;
}

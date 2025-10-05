import { IsEnum, IsUUID } from 'class-validator';

export enum LikeType {
  IDEA = 'Idea',
  COMMENT = 'Comment',
}

export class ToggleLikeInput {
  @IsUUID(undefined, { message: 'INVALID_TARGET_LIKE_ID' })
  targetLikeId: string | undefined;

  @IsEnum(LikeType, { message: 'INVALID_LIKE_TYPE' })
  likeType: LikeType;
}

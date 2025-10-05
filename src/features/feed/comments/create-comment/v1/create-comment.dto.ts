import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class CreateCommentInput {
  @IsString({ message: 'INVALID_CONTENT' })
  @Matches(/^[^{}]{3,200}$/, { message: 'INVALID_CONTENT' })
  content: string;

  @IsUUID(undefined, { message: 'INVALID_IDEA_ID' })
  ideaId: string;

  @IsUUID(undefined, { message: 'INVALID_PARENT_COMMENT_ID' })
  @IsOptional()
  parentCommentId?: string;
}

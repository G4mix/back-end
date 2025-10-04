import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class CreateCommentInput {
  @IsString({ message: 'INVALID_CONTENT' })
  @Matches(/^[^{}]{3,200}$/, { message: 'INVALID_CONTENT' })
  content: string;

  @IsUUID()
  ideaId: string;

  @IsUUID()
  @IsOptional()
  parentCommentId?: string;
}

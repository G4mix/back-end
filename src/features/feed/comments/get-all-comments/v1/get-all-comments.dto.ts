import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { CommentDto } from 'src/entities/comment.entity';

export class GetAllCommentsInput {
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

  @IsUUID(undefined, { message: 'INVALID_IDEA_ID'})
  ideaId: string;

  @IsOptional()
  @IsUUID(undefined, { message: 'INVALID_PARENT_COMMENT_ID' })
  parentCommentId?: string;
}

export class GetAllCommentsOutput {
  page: number;
  nextPage: number | null;
  pages: number;
  total: number;
  data: CommentDto[];
}

import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { CommentDto } from 'src/entities/comment.entity';

export class GetAllCommentsInput {
  @IsOptional()
  @IsNumber({}, { message: 'O campo "page" deve ser um número' })
  @Min(0, { message: 'O campo "page" deve ser maior ou igual a 0' })
  @Type(() => Number)
  page: number = 0;

  @Type(() => Number)
  @IsNumber({}, { message: 'O campo "quantity" deve ser um número' })
  @Min(1, { message: 'O campo "quantity" deve ser maior ou igual a 1' })
  @IsOptional()
  quantity: number = 10;

  @IsUUID()
  ideaId: string;

  @IsUUID()
  @IsOptional()
  parentCommentId?: string;
}

export class GetAllCommentsOutput {
  page: number;
  nextPage: number | null;
  pages: number;
  total: number;
  data: CommentDto[];
}

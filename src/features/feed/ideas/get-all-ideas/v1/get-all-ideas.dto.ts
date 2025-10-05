import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { IdeaDto } from 'src/entities/idea.entity';

export class GetAllIdeasInput {
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

  @IsOptional()
  @IsUUID(undefined, { message: 'INVALID_AUTHOR_ID' })
  authorId?: string;
}

export class GetAllIdeasOutput {
  page: number;
  nextPage: number | null;
  pages: number;
  total: number;
  data: IdeaDto[];
}

import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { ChatDto } from 'src/entities/chat.entity';

export class GetAllChatsInput {
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
}

export class GetAllChatsOutput {
  page: number;
  nextPage: number | null;
  pages: number;
  total: number;
  data: ChatDto[];
}

import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { UserDto } from 'src/entities/user.entity';

export class GetAllUsersQueryInput {
  @IsOptional()
  @IsNumber({}, { message: 'O campo "page" deve ser um número' })
  @Type(() => Number)
  page: number = 0;

  @Type(() => Number)
  @IsNumber({}, { message: 'O campo "quantity" deve ser um número' })
  @IsOptional()
  quantity: number = 10;

  @IsString({ message: 'O campo "search" deve ser uma string' })
  @IsOptional()
  search?: string | undefined = '';
}

export class GetAllUsersOutput {
  page: number;
  nextPage: number | null;
  pages: number;
  total: number;
  data: UserDto[];
}

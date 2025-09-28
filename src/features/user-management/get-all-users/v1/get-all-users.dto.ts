import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { UserProfileDto } from 'src/entities/user-profile.entity';

export class GetAllUsersInput {
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

  @IsString({ message: 'O campo "search" deve ser uma string' })
  @IsOptional()
  search?: string | undefined = '';
}

export class GetAllUsersOutput {
  page: number;
  nextPage: number | null;
  pages: number;
  total: number;
  data: UserProfileDto[];
}

import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ProjectDto } from 'src/entities/project.entity';

export class GetAllProjectsInput {
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

  @IsString({ message: 'INVALID_SEARCH' })
  @IsOptional()
  search?: string | undefined = '';
}

export class GetAllProjectsOutput {
  page: number;
  nextPage: number | null;
  pages: number;
  total: number;
  data: ProjectDto[];
}

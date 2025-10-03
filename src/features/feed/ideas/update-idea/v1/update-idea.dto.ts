import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import { parseArraySafe } from 'src/shared/utils/parseArraySafe';

export class UpdateIdeaInput {
  @IsString({ message: 'INVALID_TITLE' })
  @Matches(/^[^{}]{3,70}$/, { message: 'INVALID_TITLE' })
  @IsOptional()
  title: string;

  @IsString({ message: 'INVALID_CONTENT' })
  @Matches(/^[^{}]{3,700}$/, { message: 'INVALID_CONTENT' })
  @IsOptional()
  content: string;

  @IsOptional()
  @Transform(({ value }) => parseArraySafe(value))
  @IsArray({ message: 'LINKS_MUST_BE_ARRAY' })
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { each: true, message: 'INVALID_LINK' },
  )
  @MaxLength(700, { each: true, message: 'LINK_TOO_LONG' })
  @ArrayMaxSize(5, { message: 'TOO_MANY_LINKS' })
  links?: string[];

  @IsOptional()
  @Transform(({ value }) => parseArraySafe(value))
  @IsArray({ message: 'TAGS_MUST_BE_ARRAY' })
  @MaxLength(50, { each: true, message: 'TAGS_TOO_LONG' })
  @ArrayMaxSize(10, { message: 'TOO_MANY_TAGS' })
  tags?: string[];
}

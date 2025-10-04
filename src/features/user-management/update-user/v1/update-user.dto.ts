import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import { InvalidUserProfile } from 'src/shared/errors';
import { parseArraySafe } from 'src/shared/utils/parseArraySafe';

class UpdateUserInput {
  @IsString({ message: 'INVALID_NAME' })
  @Matches(/^[^{}]{3,50}$/, { message: 'INVALID_NAME' })
  @IsOptional()
  username?: string;

  @IsEmail({}, { message: 'INVALID_EMAIL' })
  @IsOptional()
  email?: string;

  @IsString({ message: 'INVALID_PASSWORD' })
  @Matches(/^(?=.*\d)(?=.*[A-Z])(?=.*[$*&@#! ])[^{}]{6,}$/, {
    message: 'INVALID_PASSWORD',
  })
  @IsOptional()
  password?: string;
}

export class UpdateUserProfileInput {
  @IsString({ message: 'INVALID_NAME' })
  @Matches(/^[^{}]{3,300}$/, { message: 'INVALID_NAME' })
  @IsOptional()
  displayName?: string;

  @IsString({ message: 'INVALID_AUTOBIOGRAPHY' })
  @Matches(/^[^{}]{3,500}$/, { message: 'INVALID_AUTOBIOGRAPHY' })
  @IsOptional()
  autobiography?: string;

  @IsOptional()
  @IsArray({ message: 'LINKS_MUST_BE_ARRAY' })
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { each: true, message: 'INVALID_LINK' },
  )
  @MaxLength(700, { each: true, message: 'LINK_TOO_LONG' })
  @Transform(({ value }) => parseArraySafe(value))
  links?: string[];

  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    try {
      return JSON.parse(value);
    } catch (_e) {
      throw new InvalidUserProfile();
    }
  })
  @Type(() => UpdateUserInput)
  user: UpdateUserInput = {};
}

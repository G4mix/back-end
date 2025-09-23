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
import {
  HasMimeType,
  IsFile,
  MaxFileSize,
  MemoryStoredFile,
} from 'nestjs-form-data';
import { InvalidUserProfile } from 'src/shared/errors';

function parseLinksSafe(value: any) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

class UpdateUserProfileInput {
  @IsString({ message: 'INVALID_NAME' })
  @Matches(/^[^{}]{3,300}$/, { message: 'INVALID_NAME' })
  @IsOptional()
  displayName?: string | null;

  @IsString({ message: 'INVALID_AUTOBIOGRAPHY' })
  @Matches(/^[^{}]{3,500}$/, { message: 'INVALID_AUTOBIOGRAPHY' })
  @IsOptional()
  autobiography?: string | null;

  @IsOptional()
  @IsArray({ message: 'LINKS_MUST_BE_ARRAY' })
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { each: true, message: 'INVALID_LINK' },
  )
  @MaxLength(700, { each: true, message: 'LINK_TOO_LONG' })
  @Transform(({ value }) => parseLinksSafe(value))
  links?: string[];

  @IsFile()
  @MaxFileSize(15 * 1024 * 1024)
  @HasMimeType(['image/jpeg', 'image/png'])
  @IsOptional()
  icon?: MemoryStoredFile;

  @IsFile()
  @MaxFileSize(15 * 1024 * 1024)
  @HasMimeType(['image/jpeg', 'image/png'])
  @IsOptional()
  backgroundImage?: MemoryStoredFile;
}

export class UpdateUserInput {
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

  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    try {
      return JSON.parse(value);
    } catch (_e) {
      throw new InvalidUserProfile();
    }
  })
  @Type(() => UpdateUserProfileInput)
  userProfile?: UpdateUserProfileInput;
}

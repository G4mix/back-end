import {
  IsNotEmpty,
  IsEmail,
  IsString,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';
import { UserDto } from 'src/entities/user.entity';

export class SignupInput {
  @IsEmail({}, { message: 'INVALID_EMAIL' })
  @IsNotEmpty({ message: 'EMAIL_REQUIRED' })
  readonly email: string;

  @IsNotEmpty({ message: 'PASSWORD_REQUIRED' })
  @IsString({ message: 'INVALID_PASSWORD' })
  @Matches(/^(?=.*\d)(?=.*[A-Z])(?=.*[$*&@#! ])[^{}]{6,}$/, {
    message: 'INVALID_PASSWORD',
  })
  readonly password: string;

  @IsNotEmpty({ message: 'USERNAME_REQUIRED' })
  @IsString({ message: 'INVALID_NAME' })
  @Matches(/^[^{}]{3,255}$/, { message: 'INVALID_NAME' })
  @MinLength(3, { message: 'INVALID_NAME' })
  @MaxLength(255, { message: 'INVALID_NAME' })
  readonly username: string;
}

export class SignupOutput {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

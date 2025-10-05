import { IsNotEmpty, IsEmail, IsString, Matches } from 'class-validator';
import { UserProfileDto } from 'src/entities/user-profile.entity';

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
  @Matches(/^[^{}]{3,50}$/, { message: 'INVALID_NAME' })
  readonly username: string;
}

export class SignupOutput {
  accessToken: string;
  refreshToken: string;
  userProfile: UserProfileDto;
}

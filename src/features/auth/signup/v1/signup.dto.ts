import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import { ProfileDto } from 'src/entities/profile.entity';

export class SignupInput {
  @IsEmail({}, { message: 'INVALID_EMAIL' })
  @IsNotEmpty({ message: 'EMAIL_REQUIRED' })
  readonly email: string;

  @IsNotEmpty({ message: 'PASSWORD_REQUIRED' })
  @IsString({ message: 'INVALID_PASSWORD' })
  @Matches(
    /^(?=.*\d)(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":|<>_\-+=~`[\]\\;/'])[^{}]{6,}$/,
    {
      message: 'INVALID_PASSWORD',
    },
  )
  readonly password: string;

  @IsNotEmpty({ message: 'USERNAME_REQUIRED' })
  @IsString({ message: 'INVALID_NAME' })
  @Matches(/^[^{}]{3,50}$/, { message: 'INVALID_NAME' })
  readonly username: string;
}

export class SignupOutput {
  accessToken: string;
  refreshToken: string;
  userProfile: ProfileDto;
}

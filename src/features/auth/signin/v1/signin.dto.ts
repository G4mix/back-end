import { IsNotEmpty, IsEmail, IsString } from 'class-validator';
import { UserProfileDto } from 'src/entities/user-profile.entity';

export class SigninInput {
  @IsEmail({}, { message: 'INVALID_EMAIL' })
  @IsNotEmpty({ message: 'EMAIL_REQUIRED' })
  readonly email: string;

  @IsString({ message: 'INVALID_PASSWORD' })
  @IsNotEmpty({ message: 'PASSWORD_REQUIRED' })
  readonly password: string;
}

export class SigninOutput {
  accessToken: string;
  refreshToken: string;
  userProfile: UserProfileDto;
}

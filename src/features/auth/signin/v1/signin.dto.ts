import { IsNotEmpty, IsEmail, IsString } from 'class-validator';
import { UserDto } from 'src/shared/user.dto';

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
  user: UserDto;
}

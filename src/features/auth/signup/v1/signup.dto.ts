import {
  IsNotEmpty,
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  IsUrl,
  IsArray,
  MaxLength,
} from 'class-validator';
import { UserDto } from 'src/shared/user.dto';

export class SignupInput {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;
  @IsNotEmpty()
  @IsString()
  readonly password: string;
  @IsNotEmpty()
  readonly username: string;
}

export class SignupOutput {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

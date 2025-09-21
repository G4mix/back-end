import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class RefreshTokenInput {
  @IsString({ message: 'INVALID_REFRESH_TOKEN' })
  @IsNotEmpty({ message: 'REFRESH_TOKEN_REQUIRED' })
  @IsUUID()
  readonly refreshToken: string;
}

export class RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
}

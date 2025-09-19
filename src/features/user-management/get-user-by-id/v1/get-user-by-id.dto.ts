import { IsOptional, IsString } from 'class-validator';

export class GetUserByIdParamsInput {
  @IsString({ message: 'O campo "userProfileId" deve ser uma string' })
  @IsOptional()
  userProfileId?: string | undefined;
}

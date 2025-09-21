import { IsString, IsUUID } from 'class-validator';

export class GetUserByIdInput {
  @IsString({ message: 'O campo "userProfileId" deve ser uma string' })
  @IsUUID()
  userProfileId: string;
}

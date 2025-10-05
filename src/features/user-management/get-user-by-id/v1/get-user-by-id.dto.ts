import { IsUUID } from 'class-validator';

export class GetUserByIdInput {
  @IsUUID(undefined, { message: 'INVALID_USER_PROFILE_ID' })
  userProfileId: string;
}

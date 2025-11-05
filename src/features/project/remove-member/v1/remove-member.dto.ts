import { IsUUID } from 'class-validator';

export class RemoveMemberInput {
  @IsUUID(undefined, { message: 'INVALID_PROJECT_ID' })
  projectId: string;

  @IsUUID(undefined, { message: 'INVALID_MEMBER_ID' })
  memberId: string;
}

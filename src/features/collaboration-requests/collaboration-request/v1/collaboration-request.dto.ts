import { IsString, IsUUID, Matches } from 'class-validator';

export class CollaborationRequestInput {
  @IsString({ message: 'INVALID_CONTENT' })
  @Matches(/^[^{}]{3,255}$/, { message: 'INVALID_CONTENT' })
  message: string;

  @IsUUID(undefined, { message: 'INVALID_IDEA_ID' })
  ideaId: string;
}

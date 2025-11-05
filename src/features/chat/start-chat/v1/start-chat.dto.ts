import { IsUUID } from 'class-validator';

export class StartChatInput {
  @IsUUID(undefined, { message: 'INVALID_IDEA_ID' })
  ideaId: string;

  @IsUUID(undefined, { message: 'INVALID_REQUESTER_ID' })
  requesterId: string;
}

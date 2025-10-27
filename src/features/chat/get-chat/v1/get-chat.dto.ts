import { IsUUID } from 'class-validator';

export class GetChatInput {
  @IsUUID(undefined, { message: 'INVALID_CHAT_ID' })
  chatId: string;
}

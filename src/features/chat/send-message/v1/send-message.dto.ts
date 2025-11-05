import { IsString, IsUUID, Length } from 'class-validator';

export class SendMessageInput {
  @IsUUID(undefined, { message: 'INVALID_CHAT_ID' })
  chatId: string;

  @IsString({ message: 'INVALID_MESSAGE' })
  @Length(1, 255, { message: 'MESSAGE_TOO_LONG' })
  content: string;
}

export class SendMessageOutput {
  senderId: string;
  content: string;
  timestamp: Date;
}

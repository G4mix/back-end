import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Request,
  Version,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from 'src/entities/chat.entity';
import type { RequestWithUserData } from 'src/jwt/jwt.strategy';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { ChatNotFound, UserNotAuthorized } from 'src/shared/errors';
import { ChatEvents, ChatGateway } from 'src/shared/gateways/chat.gateway';
import { safeSave } from 'src/shared/utils/safe-save.util';
import { Repository } from 'typeorm';
import { SendMessageInput, SendMessageOutput } from './send-message.dto';

@Controller('/chat')
export class SendMessageController {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    private readonly chatGateway: ChatGateway,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Post('/send-message')
  @Version('1')
  @Protected()
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Request() { user: { userProfileId } }: RequestWithUserData,
    @Body() { chatId, content }: SendMessageInput,
  ): Promise<SendMessageOutput> {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ['members', 'project'],
    });

    if (!chat) throw new ChatNotFound();

    const member = chat.members?.find((member) => member.id === userProfileId);

    if (!member) throw new UserNotAuthorized();

    const senderName = member.displayName || 'anonymous';

    const newMessage = {
      senderId: userProfileId,
      senderName,
      content,
      timestamp: new Date(),
    };

    const updatedMessages = [...(chat.messages || []), newMessage];

    await safeSave(this.chatRepository, {
      ...chat,
      messages: updatedMessages,
    });

    this.chatGateway.broadcastToChat(chatId, ChatEvents.NEW_MESSAGE, {
      chatId,
      message: newMessage,
    });

    return newMessage;
  }
}

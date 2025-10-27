import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Request,
  Version,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat, ChatDto } from 'src/entities/chat.entity';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { GetChatInput } from './get-chat.dto';
import { ChatNotFound } from 'src/shared/errors';

@Controller('/chat')
export class GetChatController {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Get('/:chatId')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Protected()
  async getChat(
    @Request() req: RequestWithUserData,
    @Param() { chatId }: GetChatInput,
  ): Promise<ChatDto> {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ['idea', 'members'],
    });

    if (!chat) throw new ChatNotFound();
    return chat.toDto(req.user?.userProfileId);
  }
}

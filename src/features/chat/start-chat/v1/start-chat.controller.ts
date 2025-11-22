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
import { Repository } from 'typeorm';
import { StartChatInput } from './start-chat.dto';
import { Chat, ChatDto } from 'src/entities/chat.entity';
import {
  CollaborationRequest,
  CollaborationRequestStatus,
} from 'src/entities/collaboration-request.entity';
import { Idea } from 'src/entities/idea.entity';
import type { RequestWithUserData } from 'src/jwt/jwt.strategy';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { safeSave } from 'src/shared/utils/safe-save.util';
import {
  IdeaNotFound,
  PendingCollaborationRequestNotFound,
  YouCannotStartChatForAnotherUserIdea,
} from 'src/shared/errors';

@Controller('/chat')
export class StartChatController {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(CollaborationRequest)
    private readonly collaborationRequestRepository: Repository<CollaborationRequest>,
    @InjectRepository(Idea)
    private readonly ideaRepository: Repository<Idea>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Post('/start')
  @Version('1')
  @Protected()
  @HttpCode(HttpStatus.CREATED)
  async startChat(
    @Request() { user: { userProfileId } }: RequestWithUserData,
    @Body() { ideaId, requesterId }: StartChatInput,
  ): Promise<ChatDto> {
    const existingRequest = await this.collaborationRequestRepository.findOne({
      where: {
        requesterId,
        ideaId,
        status: CollaborationRequestStatus.PENDING,
      },
    });

    if (!existingRequest) throw new PendingCollaborationRequestNotFound();

    const idea = await this.ideaRepository.findOne({
      where: { id: ideaId },
      relations: ['author'],
    });

    if (!idea) throw new IdeaNotFound();

    if (idea.authorId !== userProfileId) {
      throw new YouCannotStartChatForAnotherUserIdea();
    }

    const chat = await safeSave(this.chatRepository, {
      ownerId: userProfileId,
      ideaId: idea.id,
      collaborationRequestId: existingRequest.id,
      members: [{ id: userProfileId }, { id: requesterId }],
    });
    existingRequest.chatId = chat.id;
    await safeSave(this.collaborationRequestRepository, existingRequest);

    const chatWithRelations = await this.chatRepository.findOne({
      where: { id: chat.id },
      relations: ['members', 'project'],
    });

    if (!chatWithRelations) {
      return chat.toDto(userProfileId);
    }

    return chatWithRelations.toDto(userProfileId);
  }
}

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Patch,
  Query,
  Request,
  Version,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CollaborationRequest,
  CollaborationRequestStatus,
} from 'src/entities/collaboration-request.entity';
import type { RequestWithUserData } from 'src/jwt/jwt.strategy';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { Repository } from 'typeorm';
import { CollaborationApprovalInput } from './collaboration-approval.dto';
import {
  ChatNotFound,
  CollaborationRequestIsNotPending,
  CollaborationRequestNotFound,
  UserNotAuthorized,
} from 'src/shared/errors';
import { safeSave } from 'src/shared/utils/safe-save.util';
import { Chat } from 'src/entities/chat.entity';

@Controller('/collaboration-approval')
export class CollaborationApprovalController {
  constructor(
    @InjectRepository(CollaborationRequest)
    private readonly collaborationRequestRepository: Repository<CollaborationRequest>,
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Patch()
  @Version('1')
  @Protected()
  @HttpCode(HttpStatus.ACCEPTED)
  async getCollaborationRequest(
    @Request() { user: { userProfileId } }: RequestWithUserData,
    @Query()
    {
      collaborationRequestId: id,
      status,
      feedback,
    }: CollaborationApprovalInput,
  ): Promise<void> {
    const collaborationRequest =
      await this.collaborationRequestRepository.findOne({
        where: { id },
        relations: ['idea', 'requester'],
      });
    if (!collaborationRequest) throw new CollaborationRequestNotFound();

    if (collaborationRequest.status !== CollaborationRequestStatus.PENDING) {
      throw new CollaborationRequestIsNotPending();
    }

    if (collaborationRequest.idea.authorId !== userProfileId) {
      throw new UserNotAuthorized();
    }

    if (
      status === CollaborationRequestStatus.APPROVED &&
      !collaborationRequest.chatId
    ) {
      throw new ChatNotFound();
    }

    if (collaborationRequest.chatId) {
      const chatIdToDelete = collaborationRequest.chatId;
      collaborationRequest.chatId = null;
      await safeSave(this.collaborationRequestRepository, collaborationRequest);

      await this.chatRepository.delete(chatIdToDelete);
    }

    collaborationRequest.status = status;
    collaborationRequest.feedback = feedback;
    await safeSave(this.collaborationRequestRepository, collaborationRequest);
  }
}

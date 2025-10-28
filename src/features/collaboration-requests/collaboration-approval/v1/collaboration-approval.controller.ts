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
import {
  CollaborationApprovalInput,
  CollaborationApprovalQueryInput,
} from './collaboration-approval.dto';
import {
  ChatNotFound,
  CollaborationRequestIsNotPending,
  CollaborationRequestNotFound,
  UserNotAuthorized,
} from 'src/shared/errors';
import { safeSave } from 'src/shared/utils/safe-save.util';
import { Chat } from 'src/entities/chat.entity';
import { Project } from 'src/entities/project.entity';

@Controller('/collaboration-approval')
export class CollaborationApprovalController {
  constructor(
    @InjectRepository(CollaborationRequest)
    private readonly collaborationRequestRepository: Repository<CollaborationRequest>,
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Patch()
  @Version('1')
  @Protected()
  @HttpCode(HttpStatus.ACCEPTED)
  async getCollaborationRequest(
    @Request() { user: { userProfileId } }: RequestWithUserData,
    @Query()
    { collaborationRequestId: id, status }: CollaborationApprovalQueryInput,
    @Body() { feedback }: CollaborationApprovalInput,
  ): Promise<void> {
    const collaborationRequest =
      await this.collaborationRequestRepository.findOne({
        where: { id },
        relations: ['idea', 'idea.project', 'requester'],
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

    if (status !== CollaborationRequestStatus.APPROVED) return;

    let project = collaborationRequest.idea.project;
    if (!project) {
      project = await safeSave(this.projectRepository, {
        ownerId: userProfileId,
        members: [
          { id: userProfileId },
          { id: collaborationRequest.requesterId },
        ],
      });
    } else {
      await this.projectRepository
        .createQueryBuilder()
        .relation(Project, 'members')
        .of(project)
        .add(collaborationRequest.requesterId);
    }

    let chat = await this.chatRepository.findOne({
      where: { id: project.chatId! },
      relations: ['members'],
    });
    if (!chat) {
      chat = await safeSave(this.chatRepository, {
        projectId: project.id,
        ownerId: userProfileId,
        members: [
          { id: userProfileId },
          { id: collaborationRequest.requesterId },
        ],
      });
      project.chatId = chat.id;
      await safeSave(this.projectRepository, project);
    } else {
      chat.members = [...chat.members, collaborationRequest.requester];
      await safeSave(this.chatRepository, chat);
    }
  }
}

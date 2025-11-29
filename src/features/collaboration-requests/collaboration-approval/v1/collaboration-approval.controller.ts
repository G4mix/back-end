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
import { Chat } from 'src/entities/chat.entity';
import {
  CollaborationRequest,
  CollaborationRequestStatus,
} from 'src/entities/collaboration-request.entity';
import {
  NotificationType,
  RelatedEntityType,
} from 'src/entities/notification.entity';
import { Project } from 'src/entities/project.entity';
import type { RequestWithUserData } from 'src/jwt/jwt.strategy';
import { Protected } from 'src/shared/decorators/protected.decorator';
import {
  ChatNotFound,
  CollaborationRequestIsNotPending,
  CollaborationRequestNotFound,
  UserNotAuthorized,
} from 'src/shared/errors';
import { NotificationGateway } from 'src/shared/gateways/notification.gateway';
import { safeSave } from 'src/shared/utils/safe-save.util';
import { Repository } from 'typeorm';
import {
  CollaborationApprovalInput,
  CollaborationApprovalQueryInput,
} from './collaboration-approval.dto';
import { Idea } from 'src/entities/idea.entity';

@Controller('/collaboration-approval')
export class CollaborationApprovalController {
  constructor(
    @InjectRepository(CollaborationRequest)
    private readonly collaborationRequestRepository: Repository<CollaborationRequest>,
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Idea)
    private readonly ideaRepository: Repository<Idea>,
    private readonly notificationGateway: NotificationGateway,
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

    const isApproved = status === CollaborationRequestStatus.APPROVED;
    const titleCode = isApproved
      ? 'REQUEST_COLLABORATION_APPROVED'
      : 'REQUEST_COLLABORATION_REJECTED';
    const messageCode = isApproved
      ? 'MESSAGE_REQUEST_COLLABORATION_APPROVED'
      : 'MESSAGE_REQUEST_COLLABORATION_REJECTED';

    await this.notificationGateway.createAndSendNotification(
      collaborationRequest.requesterId,
      NotificationType.INVITE,
      titleCode,
      messageCode,
      userProfileId,
      collaborationRequest.id,
      RelatedEntityType.COLLABORATION_REQUEST,
    );

    if (!isApproved) return;

    let project = collaborationRequest.idea.project;
    if (!project) {
      project = await safeSave(this.projectRepository, {
        ownerId: userProfileId,
        title: collaborationRequest.idea.title,
        description: collaborationRequest.idea.content,
        backgroundImage: collaborationRequest.idea.images[0],
        members: [
          { id: userProfileId },
          { id: collaborationRequest.requesterId },
        ],
      });
      await safeSave(this.ideaRepository, {
        id: collaborationRequest.ideaId,
        projectId: project.id,
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

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
import {
  CollaborationRequest,
  CollaborationRequestStatus,
} from 'src/entities/collaboration-request.entity';
import { Idea } from 'src/entities/idea.entity';
import {
  NotificationType,
  RelatedEntityType,
} from 'src/entities/notification.entity';
import type { RequestWithUserData } from 'src/jwt/jwt.strategy';
import { Protected } from 'src/shared/decorators/protected.decorator';
import {
  CollaborationRequestAlreadyApproved,
  IdeaNotFound,
  PendingCollaborationRequestAlreadyExists,
  UserAlreadyMemberOfTheProject,
  YouCannotRequestCollaborationForYourOwnIdea,
} from 'src/shared/errors';
import { NotificationGateway } from 'src/shared/gateways/notification.gateway';
import { safeSave } from 'src/shared/utils/safe-save.util';
import { In, Repository } from 'typeorm';
import { CollaborationRequestInput } from './collaboration-request.dto';

@Controller('/collaboration-request')
export class CollaborationRequestController {
  constructor(
    @InjectRepository(CollaborationRequest)
    private readonly collaborationRequestRepository: Repository<CollaborationRequest>,
    @InjectRepository(Idea)
    private readonly ideaRepository: Repository<Idea>,
    private readonly notificationGateway: NotificationGateway,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Post()
  @Version('1')
  @Protected()
  @HttpCode(HttpStatus.CREATED)
  async collaborationRequest(
    @Request() { user: { userProfileId } }: RequestWithUserData,
    @Body() { message, ideaId }: CollaborationRequestInput,
  ): Promise<CollaborationRequest> {
    const statusesToCheck = [
      CollaborationRequestStatus.PENDING,
      CollaborationRequestStatus.APPROVED,
    ];

    const existingRequest = await this.collaborationRequestRepository.findOne({
      where: {
        requesterId: userProfileId,
        ideaId,
        status: In(statusesToCheck),
      },
    });
    if (existingRequest) {
      if (existingRequest.status === CollaborationRequestStatus.PENDING) {
        throw new PendingCollaborationRequestAlreadyExists();
      }

      if (existingRequest.status === CollaborationRequestStatus.APPROVED) {
        throw new CollaborationRequestAlreadyApproved();
      }
    }

    const idea = await this.ideaRepository.findOne({
      where: { id: ideaId },
      relations: ['project', 'project.members'],
    });

    if (!idea) throw new IdeaNotFound();

    if (idea.authorId === userProfileId) {
      throw new YouCannotRequestCollaborationForYourOwnIdea();
    }

    if (
      idea.project &&
      idea.project.members?.some((member) => member.id === userProfileId)
    ) {
      throw new UserAlreadyMemberOfTheProject();
    }

    const savedRequest = await safeSave(this.collaborationRequestRepository, {
      ideaId,
      message,
      requesterId: userProfileId,
    });

    await this.notificationGateway.createAndSendNotification(
      idea.authorId,
      NotificationType.INVITE,
      'NEW_COLLABORATION_REQUEST',
      'MESSAGE_NEW_COLLABORATION_REQUEST',
      userProfileId,
      savedRequest.id,
      RelatedEntityType.COLLABORATION_REQUEST,
    );

    return savedRequest;
  }
}

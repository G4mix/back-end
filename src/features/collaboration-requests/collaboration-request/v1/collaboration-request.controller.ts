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
import type { RequestWithUserData } from 'src/jwt/jwt.strategy';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { Repository } from 'typeorm';
import { CollaborationRequestInput } from './collaboration-request.dto';
import { safeSave } from 'src/shared/utils/safe-save.util';
import {
  IdeaNotFound,
  PendingCollaborationRequestAlreadyExists,
  YouCannotRequestCollaborationForYourOwnIdea,
} from 'src/shared/errors';
import { Idea } from 'src/entities/idea.entity';

@Controller('/collaboration-request')
export class CollaborationRequestController {
  constructor(
    @InjectRepository(CollaborationRequest)
    private readonly collaborationRequestRepository: Repository<CollaborationRequest>,
    @InjectRepository(Idea)
    private readonly ideaRepository: Repository<Idea>,
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
    const collaborationRequest =
      await this.collaborationRequestRepository.findOne({
        where: {
          requesterId: userProfileId,
          ideaId,
          status: CollaborationRequestStatus.PENDING,
        },
      });
    if (collaborationRequest) {
      throw new PendingCollaborationRequestAlreadyExists();
    }
    const idea = await this.ideaRepository.findOne({
      where: { id: ideaId },
    });
    if (!idea) throw new IdeaNotFound();

    if (idea.authorId === userProfileId) {
      throw new YouCannotRequestCollaborationForYourOwnIdea();
    }

    return await safeSave(this.collaborationRequestRepository, {
      ideaId,
      message,
      requesterId: userProfileId,
    });
  }
}

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
  CollaborationRequestIsNotPending,
  CollaborationRequestNotFound,
  UserNotAuthorized,
} from 'src/shared/errors';
import { safeSave } from 'src/shared/utils/safeSave';

@Controller('/collaboration-approval')
export class CollaborationApprovalController {
  constructor(
    @InjectRepository(CollaborationRequest)
    private readonly collaborationRequestRepository: Repository<CollaborationRequest>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Patch()
  @Version('1')
  @Protected()
  @HttpCode(HttpStatus.ACCEPTED)
  async getCollaborationRequest(
    @Request() { user: { userProfileId } }: RequestWithUserData,
    @Query() { collaborationRequestId: id, status }: CollaborationApprovalInput,
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
    collaborationRequest.status = status;
    await safeSave(this.collaborationRequestRepository, collaborationRequest);
  }
}

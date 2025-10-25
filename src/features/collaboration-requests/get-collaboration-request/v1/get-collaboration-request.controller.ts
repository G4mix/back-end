import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
  Request,
  Version,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CollaborationRequest,
  CollaborationRequestDto,
} from 'src/entities/collaboration-request.entity';
import type { RequestWithUserData } from 'src/jwt/jwt.strategy';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { Repository } from 'typeorm';
import { GetCollaborationRequestInput } from './get-collaboration-request.dto';
import {
  CollaborationRequestNotFound,
  UserNotAuthorized,
} from 'src/shared/errors';

@Controller('/collaboration-requests')
export class CollaborationRequestsController {
  constructor(
    @InjectRepository(CollaborationRequest)
    private readonly collaborationRequestRepository: Repository<CollaborationRequest>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Get()
  @Version('1')
  @Protected()
  @HttpCode(HttpStatus.OK)
  async getCollaborationRequest(
    @Request() { user: { userProfileId } }: RequestWithUserData,
    @Query() { collaborationRequestId }: GetCollaborationRequestInput,
  ): Promise<CollaborationRequestDto> {
    const collaborationRequest =
      await this.collaborationRequestRepository.findOne({
        where: { id: collaborationRequestId },
        relations: ['idea', 'requester'],
      });
    if (!collaborationRequest) throw new CollaborationRequestNotFound();
    const isRequester = collaborationRequest.requesterId === userProfileId;
    if (!isRequester && collaborationRequest.idea.authorId !== userProfileId) {
      throw new UserNotAuthorized();
    }
    return collaborationRequest.toDto(isRequester);
  }
}

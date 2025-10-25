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
import { CollaborationRequest } from 'src/entities/collaboration-request.entity';
import type { RequestWithUserData } from 'src/jwt/jwt.strategy';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { Repository } from 'typeorm';
import { CollaborationRequestInput } from './collaboration-request.dto';
import { safeSave } from 'src/shared/utils/safeSave';

@Controller('/collaboration-request')
export class CollaborationRequestController {
  constructor(
    @InjectRepository(CollaborationRequest)
    private readonly collaborationRequestRepository: Repository<CollaborationRequest>,
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
    return await safeSave(this.collaborationRequestRepository, {
      ideaId,
      message,
      requesterId: userProfileId,
    });
  }
}

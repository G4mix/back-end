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
import { Protected } from 'src/shared/decorators/protected.decorator';
import { View } from 'src/entities/view.entity';
import { Repository } from 'typeorm';
import { RecordViewInput } from './record-view.dto';
import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import { safeSave } from 'src/shared/utils/safe-save.util';

@Controller('/view')
export class RecordViewController {
  constructor(
    @InjectRepository(View)
    private readonly viewRepository: Repository<View>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Post()
  @Version('1')
  @Protected()
  @HttpCode(HttpStatus.NO_CONTENT)
  async recordView(
    @Request() { user: { userProfileId } }: RequestWithUserData,
    @Body() { targetIdeaId }: RecordViewInput,
  ) {
    await safeSave(this.viewRepository, {
      ideaId: targetIdeaId,
      profileId: userProfileId,
    });
  }
}

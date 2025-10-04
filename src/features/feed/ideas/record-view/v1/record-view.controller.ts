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
    try {
      const view = await this.viewRepository.findOne({
        where: { ideaId: targetIdeaId, userProfileId },
      });
      if (view) return;
      await this.viewRepository.insert({ ideaId: targetIdeaId, userProfileId });
    } catch (_err) {
      return;
    }
  }
}

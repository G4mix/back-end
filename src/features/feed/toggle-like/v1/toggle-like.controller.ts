import {
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Request,
  Version,
  Post,
  Body,
} from '@nestjs/common';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import { LikeType, ToggleLikeInput } from './toggle-like.dto';
import { Like } from 'src/entities/like.entity';

@Controller('/like')
export class ToggleLikeController {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Post()
  @Version('1')
  @Protected()
  @HttpCode(HttpStatus.NO_CONTENT)
  async toggleLike(
    @Request() { user: { userProfileId } }: RequestWithUserData,
    @Body() { targetLikeId, likeType }: ToggleLikeInput,
  ): Promise<void> {
    const targets = {
      [LikeType.IDEA]: { userProfileId, ideaId: targetLikeId },
      [LikeType.COMMENT]: { userProfileId, commentId: targetLikeId },
    };

    const targetLike = await this.likeRepository.findOne({
      where: targets[likeType],
    });

    if (targetLike) {
      await this.likeRepository.delete(targetLike.id);
      return;
    }

    await this.likeRepository.insert(targets[likeType]);
  }
}

import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Logger,
  Request,
  Body,
  Version,
} from '@nestjs/common';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { Follow } from 'src/entities/follow.entity';
import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import { UserNotFound, YouCannotFollowYourself } from 'src/shared/errors';
import { ToggleFollowInput } from './toggle-follow.dto';
import { safeSave } from 'src/shared/utils/safeSave';

@Controller('/follow')
export class ToggleFollowController {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Post()
  @Version('1')
  @Protected()
  @HttpCode(HttpStatus.NO_CONTENT)
  async toggleFollow(
    @Request() { user: { userProfileId } }: RequestWithUserData,
    @Body() { targetUserId }: ToggleFollowInput,
  ): Promise<void> {
    if (userProfileId === targetUserId) throw new YouCannotFollowYourself();
    const targetUser = await this.userRepository.findOne({
      where: { userProfileId: targetUserId },
    });
    if (!targetUser) throw new UserNotFound();

    const existingFollow = await this.followRepository.findOne({
      where: {
        followerUserId: userProfileId,
        followingUserId: targetUserId,
      },
    });
    if (existingFollow) {
      await this.followRepository.delete(existingFollow.id);
      return;
    }

    await safeSave(this.followRepository, {
      followerUserId: userProfileId,
      followingUserId: targetUserId,
    });
  }
}

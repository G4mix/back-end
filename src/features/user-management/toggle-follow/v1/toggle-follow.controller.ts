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
import { Follow } from 'src/entities/follow.entity';
import { Project } from 'src/entities/project.entity';
import { User } from 'src/entities/user.entity';
import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import { Protected } from 'src/shared/decorators/protected.decorator';
import {
  InvalidTarget,
  ProjectNotFound,
  UserNotFound,
  YouCannotFollowYourself,
} from 'src/shared/errors';
import { safeSave } from 'src/shared/utils/safe-save.util';
import { Repository } from 'typeorm';
import { ToggleFollowInput } from './toggle-follow.dto';

@Controller('/follow')
export class ToggleFollowController {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Post()
  @Version('1')
  @Protected()
  @HttpCode(HttpStatus.NO_CONTENT)
  async toggleFollow(
    @Request() { user: { userProfileId } }: RequestWithUserData,
    @Body() { targetUserId, targetProjectId }: ToggleFollowInput,
  ): Promise<void> {
    if (userProfileId === targetUserId) throw new YouCannotFollowYourself();
    else if (targetUserId && targetProjectId) throw new InvalidTarget();

    if (targetUserId) {
      const targetUser = await this.userRepository.findOne({
        where: { profileId: targetUserId },
      });
      if (!targetUser) throw new UserNotFound();
    } else if (targetProjectId) {
      const targetProject = await this.projectRepository.findOne({
        where: { id: targetProjectId },
      });
      if (!targetProject) throw new ProjectNotFound();
    }

    const followData = Object.assign(
      {
        followerUserId: userProfileId,
      },
      targetUserId
        ? { followingUserId: targetUserId }
        : { followingProjectId: targetProjectId },
    );

    const existingFollow = await this.followRepository.findOne({
      where: followData,
    });
    if (existingFollow) {
      await this.followRepository.delete(existingFollow.id);
      return;
    }

    await safeSave(this.followRepository, followData);
    return;
  }
}

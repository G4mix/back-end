import { Controller, Get, Logger, Request, Version } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile, ProfileDto } from 'src/entities/profile.entity';
import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { UserNotFound } from 'src/shared/errors';
import { Repository } from 'typeorm';

@Controller('/user')
export class GetMyUserController {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Get('/my-user')
  @Version('1')
  @Protected()
  async getMyUser(@Request() req: RequestWithUserData): Promise<ProfileDto> {
    const profile = await this.profileRepository.findOne({
      where: { id: req.user.userProfileId },
      relations: ['user', 'followers', 'following'],
    });
    if (!profile) throw new UserNotFound();
    return profile.toDto(req.user.userProfileId);
  }
}

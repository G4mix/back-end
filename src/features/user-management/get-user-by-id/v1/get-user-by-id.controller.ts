import {
  Controller,
  Get,
  Logger,
  Param,
  Request,
  Version,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserNotFound } from 'src/shared/errors';
import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import { GetUserByIdInput } from './get-user-by-id.dto';
import { Profile, ProfileDto } from 'src/entities/profile.entity';

@Controller('/user')
export class GetUserByIdController {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Get('/:userProfileId')
  @Version('1')
  async getUserbyId(
    @Param() { userProfileId }: GetUserByIdInput,
    @Request() req: RequestWithUserData,
  ): Promise<ProfileDto> {
    const profile = await this.profileRepository.findOne({
      where: { id: userProfileId },
      relations: ['user', 'followers', 'following'],
    });
    if (!profile) throw new UserNotFound();
    return profile.toDto(req.user?.userProfileId);
  }
}

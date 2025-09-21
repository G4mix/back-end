import {
  Controller,
  Get,
  Logger,
  Param,
  Request,
  Version,
} from '@nestjs/common';
import { LogResponseTime } from 'src/shared/decorators/log-response-time.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserDto } from 'src/entities/user.entity';
import { UserNotFound } from 'src/shared/errors';
import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import { GetUserByIdParamsInput } from './get-user-by-id.dto';

@Controller('/user')
export class GetUserByIdController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Get('/:userProfileId')
  @Version('1')
  @LogResponseTime()
  async getUserbyId(
    @Param() params: GetUserByIdParamsInput,
    @Request() req: RequestWithUserData,
  ): Promise<UserDto> {
    const { userProfileId } = params;
    const user = await this.userRepository.findOne({
      where: { userProfileId },
      relations: [
        'userProfile',
        'userProfile.links',
        'userProfile.followers',
        'userProfile.following',
      ],
    });
    if (!user) throw new UserNotFound();
    return user.toDto(req.user?.userProfileId);
  }
}

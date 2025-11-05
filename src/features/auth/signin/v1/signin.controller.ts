import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Version,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { SigninInput, SigninOutput } from './signin.dto';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { REFRESH_TOKEN_EXPIRATION } from 'src/jwt/constants';
import { InvalidEmailOrPassword } from 'src/shared/errors';
import { safeSave } from 'src/shared/utils/safe-save.util';
import { Throttle } from '@nestjs/throttler';

@Controller('/auth')
export class SignInController {
  readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  @Post('/signin')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async signin(@Body() body: SigninInput): Promise<SigninOutput> {
    const user = await this.userRepository.findOne({
      where: { email: body.email },
      relations: [
        'profile',
        'profile.followers',
        'profile.following',
        'profile.user',
      ],
    });

    if (!user) throw new InvalidEmailOrPassword();

    // todo: if the user is not verified, send a verification email

    if (!(await compare(body.password, user.password))) {
      throw new InvalidEmailOrPassword();
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      userProfileId: user.profileId,
    });
    const refreshToken = this.jwtService.sign(
      { sub: user.id, userProfileId: user.profileId },
      { expiresIn: REFRESH_TOKEN_EXPIRATION },
    );

    user.refreshToken = refreshToken;
    await safeSave(this.userRepository, user);

    return {
      accessToken,
      refreshToken,
      userProfile: user.profile.toDto(),
    };
  }
}

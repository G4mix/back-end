import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Response,
  Version,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { SignupInput, SignupOutput } from './signup.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { REFRESH_TOKEN_EXPIRATION } from 'src/jwt/constants';
import { JwtService } from '@nestjs/jwt';
import { LogResponseTime } from 'src/shared/decorators/log-response-time.decorator';

@Controller('/auth')
export class SignupController {
  readonly logger = new Logger(this.constructor.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  @Post('/signup')
  @HttpCode(HttpStatus.CREATED)
  @Version('1')
  @LogResponseTime()
  public async signup(@Body() body: SignupInput): Promise<SignupOutput> {
    const existingUser = await this.userRepository.findOne({
      where: { email: body.email.toLowerCase() },
      relations: [
        'userProfile',
        'userProfile.links',
        'userProfile.followers',
        'userProfile.following',
        'userCode',
      ],
    });
    if (existingUser) throw new BadRequestException('USER_ALREADY_EXISTS');

    const newUser = await this.userRepository.save(body);
    const accessToken = this.jwtService.sign({
      sub: newUser.id,
      userProfileId: newUser.userProfileId,
    });
    const refreshToken = this.jwtService.sign(
      { sub: newUser.id, userProfileId: newUser.userProfileId },
      { expiresIn: REFRESH_TOKEN_EXPIRATION },
    );
    newUser.refreshTokenId = refreshToken;

    return {
      accessToken,
      refreshToken,
      user: newUser.toDto(newUser.id),
    };
  }
}

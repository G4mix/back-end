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
import { Repository, DataSource } from 'typeorm';
import { SignupInput, SignupOutput } from './signup.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { REFRESH_TOKEN_EXPIRATION } from 'src/jwt/constants';
import { JwtService } from '@nestjs/jwt';
import { LogResponseTime } from 'src/shared/decorators/log-response-time.decorator';
import { UserProfile } from 'src/entities/user-profile.entity';
import { UserCode } from 'src/entities/user-code.entity';
import { hashSync } from 'bcrypt';

@Controller('/auth')
export class SignupController {
  readonly logger = new Logger(this.constructor.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(UserCode)
    private readonly userCodeRepository: Repository<UserCode>,
    private readonly dataSource: DataSource,
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

    const userProfile = await this.userProfileRepository.save({});
    const userCode = await this.userCodeRepository.save({});
    const password = hashSync(body.password, 10);
    const newUser = await this.userRepository.save({
      ...body,
      password,
      email: body.email.toLowerCase(),
      userProfileId: userProfile.id,
      userCodeId: userCode.id,
    });
    const userWithRelations = await this.userRepository.findOne({
      where: { id: newUser.id },
      relations: [
        'userProfile',
        'userProfile.links',
        'userProfile.followers',
        'userProfile.following',
        'userCode',
      ],
    });

    const accessToken = this.jwtService.sign({
      sub: newUser.id,
      userProfileId: newUser.userProfileId,
    });
    const refreshToken = this.jwtService.sign(
      { sub: newUser.id, userProfileId: newUser.userProfileId },
      { expiresIn: REFRESH_TOKEN_EXPIRATION },
    );

    await this.userRepository.update(newUser.id, {
      refreshTokenId: refreshToken,
    });

    return {
      accessToken,
      refreshToken,
      user: userWithRelations!.toDto(newUser.id),
    };
  }
}

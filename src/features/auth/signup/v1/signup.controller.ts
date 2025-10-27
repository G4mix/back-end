import {
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
import { Profile } from 'src/entities/profile.entity';
import { hashSync } from 'bcrypt';
import { SESGateway } from 'src/shared/gateways/ses.gateway';
import { UserAlreadyExists } from 'src/shared/errors';
import { safeSave } from 'src/shared/utils/safe-save.util';

@Controller('/auth')
export class SignupController {
  readonly logger = new Logger(this.constructor.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly sesGateway: SESGateway,
    private readonly jwtService: JwtService,
  ) {}

  @Post('/signup')
  @HttpCode(HttpStatus.CREATED)
  @Version('1')
  public async signup(@Body() body: SignupInput): Promise<SignupOutput> {
    const existingUser = await this.userRepository.findOne({
      where: { email: body.email.toLowerCase() },
    });
    if (existingUser) throw new UserAlreadyExists();

    const profile = await safeSave(this.profileRepository, {
      displayName: body.username,
    });
    const password = hashSync(body.password, 10);
    const newUser = await safeSave(this.userRepository, {
      ...body,
      password,
      email: body.email.toLowerCase(),
      profileId: profile.id,
    });
    const userWithRelations = await this.profileRepository.findOne({
      where: { id: newUser.profileId },
      relations: ['followers', 'following', 'user'],
    });

    const accessToken = this.jwtService.sign({
      sub: newUser.id,
      userProfileId: newUser.profileId,
    });
    const refreshToken = this.jwtService.sign(
      { sub: newUser.id, userProfileId: newUser.profileId },
      { expiresIn: REFRESH_TOKEN_EXPIRATION },
    );

    await this.userRepository.update(newUser.id, { refreshToken });

    // todo: send email verification

    return {
      accessToken,
      refreshToken,
      userProfile: userWithRelations!.toDto(),
    };
  }
}

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
import { UserProfile } from 'src/entities/user-profile.entity';
import { UserCode } from 'src/entities/user-code.entity';
import { hashSync } from 'bcrypt';
import { SESGateway } from 'src/shared/gateways/ses.gateway';
import { UserAlreadyExists } from 'src/shared/errors';
import { safeSave } from 'src/shared/utils/safeSave';

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

    const userProfile = await safeSave(this.userProfileRepository, {});
    const userCode = await safeSave(this.userCodeRepository, {});
    const password = hashSync(body.password, 10);
    const newUser = await safeSave(this.userRepository, {
      ...body,
      password,
      email: body.email.toLowerCase(),
      userProfileId: userProfile.id,
      userCodeId: userCode.id,
    });
    const userWithRelations = await this.userProfileRepository.findOne({
      where: { id: newUser.userProfileId },
      relations: ['links', 'followers', 'following', 'user'],
    });

    const accessToken = this.jwtService.sign({
      sub: newUser.id,
      userProfileId: newUser.userProfileId,
    });
    const refreshToken = this.jwtService.sign(
      { sub: newUser.id, userProfileId: newUser.userProfileId },
      { expiresIn: REFRESH_TOKEN_EXPIRATION },
    );

    await this.userRepository.update(newUser.id, { refreshToken });

    this.sesGateway.verifyIdentity(body.email);

    return {
      accessToken,
      refreshToken,
      userProfile: userWithRelations!.toDto(),
    };
  }
}

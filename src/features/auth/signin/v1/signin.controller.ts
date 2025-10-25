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
import { safeSave } from 'src/shared/utils/safeSave';

@Controller('/auth')
export class SignInController {
  private readonly MAX_ATTEMPTS = 5;
  private readonly BLOCK_TIME_MS = 30 * 60 * 1000;
  readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    // private readonly sesGateway: SESGateway,
  ) {}

  @Post('/signin')
  @Version('1')
  @HttpCode(HttpStatus.OK)
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

    // if (!user.verified) {
    //   const res = await this.sesGateway.checkEmailStatus(body.email);
    //   if (res?.status === 'Success') {
    //     user.verified = true;
    //     await this.userRepository.save(user);
    //     await this.sesGateway.sendEmail({
    //       template: 'SignUp',
    //       receiver: user.email,
    //     });
    //   }
    // }

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

import {
  BadRequestException,
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
import { TooManyLoginAttempts, UserNotFound } from 'src/shared/errors';

@Controller('/auth')
export class SignInController {
  private readonly MAX_ATTEMPTS = 5;
  private readonly BLOCK_TIME_MS = 30 * 60 * 1000;
  readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  @Post('/signin')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  async signin(@Body() body: SigninInput): Promise<SigninOutput> {
    const user = await this.userRepository.findOne({
      where: { email: body.email },
      relations: [
        'userProfile',
        'userProfile.links',
        'userProfile.followers',
        'userProfile.following',
      ],
    });

    if (!user) throw new UserNotFound();

    // Verificação de e-mail (se tiver SES)
    // if (!user.verified) {
    //   const res = await this.sesService.checkEmailStatus(email);
    //   if (res?.status === 'Success') {
    //     user.verified = true;
    //     await this.userRepository.save(user);
    //     await this.sesService.sendEmail({ template: 'SignUp', receiver: user.email });
    //   }
    // }

    const now = new Date();

    if (user.loginAttempts >= this.MAX_ATTEMPTS) {
      if (user.blockedUntil && user.blockedUntil > now) {
        throw new TooManyLoginAttempts();
      }
      user.loginAttempts = 0;
      user.blockedUntil = null;
      await this.userRepository.save(user);
    }

    if (!(await compare(body.password, user.password))) {
      user.loginAttempts += 1;
      if (user.loginAttempts === this.MAX_ATTEMPTS) {
        user.blockedUntil = new Date(now.getTime() + this.BLOCK_TIME_MS);
        // await this.sesService.sendEmail({ template: 'BlockedAccount', receiver: email });
      }
      await this.userRepository.save(user);

      const errors = [
        'WRONG_PASSWORD_ONCE',
        'WRONG_PASSWORD_TWICE',
        'WRONG_PASSWORD_THREE_TIMES',
        'WRONG_PASSWORD_FOUR_TIMES',
        'WRONG_PASSWORD_FIVE_TIMES',
      ];

      throw new BadRequestException(errors[user.loginAttempts - 1]);
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      userProfileId: user.userProfileId,
    });
    const refreshToken = this.jwtService.sign(
      { sub: user.id, userProfileId: user.userProfileId },
      { expiresIn: REFRESH_TOKEN_EXPIRATION },
    );

    user.loginAttempts = 0;
    user.blockedUntil = null;
    user.refreshToken = refreshToken;
    await this.userRepository.save(user);

    return {
      accessToken,
      refreshToken,
      user: user.toDto(user.id),
    };
  }
}

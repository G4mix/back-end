import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Version,
} from '@nestjs/common';
import { RefreshTokenInput, RefreshTokenOutput } from './refresh-token.dto';
import { JwtService } from '@nestjs/jwt';
import { Claims } from 'src/jwt/jwt.strategy';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { InvalidRefreshToken, UserNotFound } from 'src/shared/errors';
import { REFRESH_TOKEN_EXPIRATION } from 'src/jwt/constants';
import { InjectRepository } from '@nestjs/typeorm';

@Controller('/auth')
export class RefreshTokenController {
  readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Post('/refresh-token')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() body: RefreshTokenInput,
  ): Promise<RefreshTokenOutput> {
    const decodedToken = this.jwtService.decode<Claims>(body.refreshToken);
    if (!decodedToken || !decodedToken.sub) throw new InvalidRefreshToken();
    const userId = decodedToken.sub;
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UserNotFound();

    const accessToken = this.jwtService.sign({
      sub: user.id,
      userProfileId: user.profileId,
    });
    const refreshToken = this.jwtService.sign(
      { sub: user.id, userProfileId: user.profileId },
      { expiresIn: REFRESH_TOKEN_EXPIRATION },
    );

    await this.userRepository.update(userId, { refreshToken });

    return {
      accessToken,
      refreshToken,
    };
  }
}

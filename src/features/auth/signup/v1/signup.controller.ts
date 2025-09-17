import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Response,
  Version,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { SignupInput, SignupOutput } from './signup.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { REFRESH_TOKEN_EXPIRATION } from 'src/shared/constants/jwt';
import { UserDto } from 'src/shared/user.dto';
import { JwtService } from '@nestjs/jwt';

@Controller('/auth')
export class SignupController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  @Post('/signup')
  @HttpCode(HttpStatus.CREATED)
  @Version('1')
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

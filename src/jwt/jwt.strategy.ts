/* eslint-disable */ 
import { Injectable, Request, Param } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/entities/user.entity';
import { UserNotAuthorized } from 'src/shared/errors';
import { Repository } from 'typeorm';

export interface Claims {
	sub: string;
	userProfileId: string;
	verifiedEmail?: boolean;
	validRoutes?: { route: string; method: string; }[]
	exp?: number;
}

export interface RequestWithUserData extends Request {
  user: Claims;
}


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SIGNING_KEY_SECRET,
      errorMessage: 'USER_NOT_AUTHORIZED',
    });
  }

  async validate(payload: Claims) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub }
    })
    if (!user) throw new UserNotAuthorized();
    return payload;
  }
}

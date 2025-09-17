/* eslint-disable */ 
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export type Claims = {
	sub: string;
	userProfileId: string;
	verifiedEmail?: boolean;
	validRoutes?: { route: string; method: string; }[]
	exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SIGNING_KEY_SECRET,
      errorMessage: 'USER_NOT_AUTHORIZED',
    });
  }

  async validate(payload: Claims) {
    console.log(payload);
    return payload;
  }
}

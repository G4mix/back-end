import * as jwt from 'jsonwebtoken';

export interface TestJwtPayload {
  sub: string;
  userProfileId: string;
  iat?: number;
  exp?: number;
}

export function generateTestJwt(payload: Partial<TestJwtPayload> = {}): string {
  const now = Math.floor(Date.now() / 1000);

  const defaultPayload: TestJwtPayload = {
    sub: 'd171ea8c2a1c4d79aa',
    userProfileId: 'profile-id',
    ...payload,
  };

  const jwtPayload = {
    ...defaultPayload,
    iat: now,
    exp: now + 365 * 24 * 60 * 60, // 1 ano em segundos
  };

  const secret =
    process.env.JWT_SIGNING_KEY_SECRET ||
    'a-string-secret-at-least-256-bits-long';
  return jwt.sign(jwtPayload, secret);
}

import { UnauthorizedException } from '@nestjs/common';

export class UserNotAuthorized extends UnauthorizedException {
  constructor() {
    super('Usuário não autorizado');
  }
}

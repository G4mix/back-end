import {
  ConflictException,
  HttpException,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

export class UserNotAuthorized extends ForbiddenException {
  constructor() {
    super('USER_NOT_AUTHORIZED');
  }
}

export class UserAlreadyExists extends ConflictException {
  constructor() {
    super('USER_ALREADY_EXISTS');
  }
}

export class UserNotFound extends NotFoundException {
  constructor() {
    super('USER_NOT_FOUND');
  }
}

export class TooManyLoginAttempts extends HttpException {
  constructor() {
    super('TOO_MANY_LOGIN_ATTEMPTS', HttpStatus.TOO_MANY_REQUESTS);
  }
}

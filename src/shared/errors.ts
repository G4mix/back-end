import { InternalServiceErrorException } from '@aws-sdk/client-sesv2';
import {
  ConflictException,
  HttpException,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
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

export class YouCannotFollowYourself extends BadRequestException {
  constructor() {
    super('YOU_CANNOT_FOLLOW_YOURSELF');
  }
}

export class InvalidUserProfile extends BadRequestException {
  constructor() {
    super('INVALID_USER_PROFILE');
  }
}
export class InvalidImageType extends BadRequestException {
  constructor() {
    super('INVALID_IMAGE_TYPE');
  }
}

export class PictureUpdateFail extends InternalServiceErrorException {
  constructor() {
    super({ message: 'PICTURE_UPDATE_FAIL', $metadata: {} });
  }
}

export class InvalidRefreshToken extends BadRequestException {
  constructor() {
    super('INVALID_REFRESH_TOKEN');
  }
}

export class InvalidEmailOrPassword extends BadRequestException {
  constructor() {
    super('INVALID_EMAIL_OR_PASSWORD');
  }
}

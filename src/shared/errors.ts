import { InternalServiceErrorException } from '@aws-sdk/client-sesv2';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
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

export class InvalidProfile extends BadRequestException {
  constructor() {
    super('INVALID_PROFILE');
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

export class IdeaNotFound extends NotFoundException {
  constructor() {
    super('IDEA_NOT_FOUND');
  }
}

export class AtLeastOneImage extends NotFoundException {
  constructor() {
    super('AT_LEAST_ONE_IMAGE_IS_REQUIRED');
  }
}

export class ThatIsNotYourIdea extends NotFoundException {
  constructor() {
    super('THAT_IS_NOT_YOUR_IDEA');
  }
}

export class CommentNotFound extends NotFoundException {
  constructor() {
    super('COMMENT_NOT_FOUND');
  }
}

export class CollaborationRequestNotFound extends NotFoundException {
  constructor() {
    super('COLLABORATION_REQUEST_NOT_FOUND');
  }
}

export class CollaborationRequestIsNotPending extends BadRequestException {
  constructor() {
    super('COLLABORATION_REQUEST_IS_NOT_PENDING');
  }
}

export class PendingCollaborationRequestAlreadyExists extends ConflictException {
  constructor() {
    super('PENDING_COLLABORATION_REQUEST_ALREADY_EXISTS');
  }
}

export class YouCannotRequestCollaborationForYourOwnIdea extends BadRequestException {
  constructor() {
    super('YOU_CANNOT_REQUEST_COLLABORATION_FOR_YOUR_OWN_IDEA');
  }
}

export class ChatNotFound extends NotFoundException {
  constructor() {
    super('CHAT_NOT_FOUND');
  }
}

export class PendingCollaborationRequestNotFound extends NotFoundException {
  constructor() {
    super('PENDING_COLLABORATION_REQUEST_NOT_FOUND');
  }
}

export class YouCannotStartChatForAnotherUserIdea extends BadRequestException {
  constructor() {
    super('YOU_CANNOT_START_CHAT_FOR_ANOTHER_USER_IDEA');
  }
}

export class YouAreNotTheOwner extends BadRequestException {
  constructor() {
    super('YOU_ARE_NOT_THE_OWNER');
  }
}

export class ProjectNotFound extends NotFoundException {
  constructor() {
    super('PROJECT_NOT_FOUND');
  }
}

export class InvalidTarget extends BadRequestException {
  constructor() {
    super('INVALID_TARGET');
  }
}

export class YouCannotRemoveTheOwner extends BadRequestException {
  constructor() {
    super('YOU_CANNOT_REMOVE_THE_OWNER');
  }
}

export class CollaborationRequestAlreadyApproved extends BadRequestException {
  constructor() {
    super('COLLABORATION_REQUEST_ALREADY_APPROVED');
  }
}

export class UserAlreadyMemberOfTheProject extends BadRequestException {
  constructor() {
    super('USER_ALREADY_MEMBER_OF_THE_PROJECT');
  }
}

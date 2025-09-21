import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PROTECTED_KEY } from '../shared/decorators/protected.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isProtected = this.reflector.getAllAndOverride<boolean>(
      IS_PROTECTED_KEY,
      [context.getHandler(), context.getClass()],
    );
    const request = context.switchToHttp().getRequest<Request>();
    const hasToken = request.headers['authorization'] as string;
    if (!isProtected && !hasToken) return true;
    return super.canActivate(context);
  }
}

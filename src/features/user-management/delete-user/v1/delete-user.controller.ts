import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
  Request,
  Version,
} from '@nestjs/common';
import { LogResponseTime } from 'src/shared/decorators/log-response-time.decorator';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { type RequestWithUserData } from 'src/jwt/jwt.strategy';

@Controller('/user-management')
export class DeleteUserController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Delete('/delete-user')
  @Version('1')
  @Protected()
  @LogResponseTime()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Request() req: RequestWithUserData): Promise<void> {
    await this.userRepository.delete(req.user.sub);
  }
}

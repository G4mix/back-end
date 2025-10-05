import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
  Request,
  Version,
} from '@nestjs/common';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import { S3Gateway } from 'src/shared/gateways/s3.gateway';
import { ConfigService } from '@nestjs/config';

@Controller('/user')
export class DeleteUserController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly s3Gateway: S3Gateway,
    private readonly configService: ConfigService,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Delete()
  @Version('1')
  @Protected()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Request() req: RequestWithUserData): Promise<void> {
    await this.s3Gateway.deleteFolder(
      this.configService.get<string>('PUBLIC_BUCKET_NAME')!,
      `user-${req.user.sub}`,
    );
    await this.userRepository.delete(req.user.sub);
  }
}

import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import {
  Controller,
  Get,
  Logger,
  Query,
  Request,
  Version,
} from '@nestjs/common';
import { LogResponseTime } from 'src/shared/decorators/log-response-time.decorator';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { GetAllUsersOutput, GetAllUsersQueryInput } from './get-all-users.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';

@Controller('/user-management')
export class GetAllUsersController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Get('/get-all-users')
  @Version('1')
  @Protected()
  @LogResponseTime()
  async getAllUsers(
    @Request() req: RequestWithUserData,
    @Query() query: GetAllUsersQueryInput,
  ): Promise<GetAllUsersOutput> {
    const { search, quantity, page } = query;
    console.log(req.user.sub);
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userProfile', 'userProfile')
      .leftJoinAndSelect('userProfile.links', 'links')
      .leftJoinAndSelect('userProfile.followers', 'followers')
      .leftJoinAndSelect('userProfile.following', 'following')
      .where('user.id != :currentUserId', { currentUserId: req.user.sub });

    if (search && search.trim() !== '') {
      qb.andWhere(
        '(user.username ILIKE :search OR userProfile.displayName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.skip(page * quantity).take(quantity);

    const [users, total] = await qb.getManyAndCount();
    const pages = Math.ceil(total / quantity);
    const nextPage = page + 1;

    return {
      total,
      pages,
      page,
      nextPage: nextPage >= pages ? null : nextPage,
      data: users.map((user) => user.toDto(req.user.sub)),
    };
  }
}

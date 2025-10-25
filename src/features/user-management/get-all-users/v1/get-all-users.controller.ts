import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import {
  Controller,
  Get,
  Logger,
  Query,
  Request,
  Version,
} from '@nestjs/common';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { GetAllUsersOutput, GetAllUsersInput } from './get-all-users.dto';
import { Repository } from 'typeorm';
import { UserProfile } from 'src/entities/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Controller('/user')
export class GetAllUsersController {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Get()
  @Version('1')
  @Protected()
  async getAllUsers(
    @Request() req: RequestWithUserData,
    @Query() { search, quantity, page }: GetAllUsersInput,
  ): Promise<GetAllUsersOutput> {
    const qb = this.userProfileRepository
      .createQueryBuilder('userProfile')
      .leftJoinAndSelect('userProfile.user', 'user')
      .leftJoinAndSelect('userProfile.links', 'links')
      .leftJoinAndSelect('userProfile.followers', 'followers')
      .leftJoinAndSelect('userProfile.following', 'following')
      .where('userProfile.id != :currentUserId', {
        currentUserId: req.user.userProfileId,
      });

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
      data: users.map((user) => user.toDto(req.user.userProfileId)),
    };
  }
}

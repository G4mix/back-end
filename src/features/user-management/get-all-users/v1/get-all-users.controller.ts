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
import { Profile } from 'src/entities/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Controller('/user')
export class GetAllUsersController {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Get()
  @Version('1')
  @Protected()
  async getAllUsers(
    @Request() req: RequestWithUserData,
    @Query() { search, quantity, page }: GetAllUsersInput,
  ): Promise<GetAllUsersOutput> {
    const qb = this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .leftJoinAndSelect('profile.followers', 'followers')
      .leftJoinAndSelect('profile.following', 'following')
      .where('profile.id != :currentUserId', {
        currentUserId: req.user.userProfileId,
      });

    if (search && search.trim() !== '') {
      qb.andWhere(
        '(user.username ILIKE :search OR profile.displayName ILIKE :search)',
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

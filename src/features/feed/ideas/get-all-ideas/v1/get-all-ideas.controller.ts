import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import {
  Controller,
  Get,
  Logger,
  Query,
  Request,
  Version,
} from '@nestjs/common';
import { GetAllIdeasOutput, GetAllIdeasInput } from './get-all-ideas.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Idea } from 'src/entities/idea.entity';

@Controller('/idea')
export class GetAllIdeasController {
  constructor(
    @InjectRepository(Idea)
    private readonly ideaRepository: Repository<Idea>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Get()
  @Version('1')
  async getAllIdeas(
    @Request() req: RequestWithUserData,
    @Query() { quantity, page, authorId }: GetAllIdeasInput,
  ): Promise<GetAllIdeasOutput> {
    const qb = this.ideaRepository
      .createQueryBuilder('idea')
      .leftJoinAndSelect('idea.author', 'author')
      .leftJoinAndSelect('author.user', 'user')
      .leftJoinAndSelect('idea.images', 'images')
      .leftJoinAndSelect('idea.tags', 'tags')
      .leftJoinAndSelect('idea.comments', 'comments')
      .leftJoinAndSelect('idea.likes', 'likes')
      .leftJoinAndSelect('idea.views', 'views')
      .leftJoinAndSelect('idea.links', 'links');

    if (authorId) {
      qb.andWhere('idea.authorId = :authorId', { authorId });
    } else if (!authorId && req.user?.userProfileId) {
      qb.andWhere('idea.authorId != :userProfileId', {
        userProfileId: req.user.userProfileId,
      });
    }

    qb.skip(page * quantity).take(quantity);

    const [ideas, total] = await qb.getManyAndCount();
    const pages = Math.ceil(total / quantity);
    const nextPage = page + 1;

    return {
      total,
      pages,
      page,
      nextPage: nextPage >= pages ? null : nextPage,
      data: ideas.map((idea) => idea.toDto(req.user?.userProfileId)),
    };
  }
}

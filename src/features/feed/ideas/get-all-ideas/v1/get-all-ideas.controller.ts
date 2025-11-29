import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
  Request,
  Version,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Idea } from 'src/entities/idea.entity';
import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import { Repository } from 'typeorm';
import { GetAllIdeasInput, GetAllIdeasOutput } from './get-all-ideas.dto';

@Controller('/idea')
export class GetAllIdeasController {
  constructor(
    @InjectRepository(Idea)
    private readonly ideaRepository: Repository<Idea>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  async getAllIdeas(
    @Request() req: RequestWithUserData,
    @Query() { quantity, page, authorId, projectId }: GetAllIdeasInput,
  ): Promise<GetAllIdeasOutput> {
    const qb = this.ideaRepository
      .createQueryBuilder('idea')
      .leftJoinAndSelect('idea.author', 'author')
      .leftJoinAndSelect('author.user', 'user')
      .leftJoinAndSelect('idea.tags', 'tags')
      .leftJoinAndSelect('idea.comments', 'comments')
      .leftJoinAndSelect('idea.likes', 'likes')
      .leftJoinAndSelect('idea.views', 'views')
      .leftJoinAndSelect('idea.collaborationRequests', 'collaborationRequests')
      .leftJoinAndSelect('idea.project', 'project')
      .leftJoinAndSelect('project.members', 'projectMembers');

    if (authorId) {
      qb.andWhere('idea.authorId = :authorId', { authorId });
    } else if (!authorId && req.user?.userProfileId && !projectId) {
      qb.andWhere('idea.authorId != :userProfileId', {
        userProfileId: req.user.userProfileId,
      });
    }

    if (projectId) {
      qb.andWhere('idea.projectId = :projectId', { projectId });
    } else {
      qb.andWhere('idea.projectId IS NULL');
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

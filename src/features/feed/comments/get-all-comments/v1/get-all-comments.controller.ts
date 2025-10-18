import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
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
import {
  GetAllCommentsInput,
  GetAllCommentsOutput,
} from './get-all-comments.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from 'src/entities/comment.entity';
import { IdeaNotFound } from 'src/shared/errors';
import { Idea } from 'src/entities/idea.entity';

@Controller('/comment')
export class GetAllCommentsController {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Idea)
    private readonly ideaRepository: Repository<Idea>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  async getAllComments(
    @Request() req: RequestWithUserData,
    @Query() { quantity, page, ideaId, parentCommentId }: GetAllCommentsInput,
  ): Promise<GetAllCommentsOutput> {
    if (!ideaId) throw new IdeaNotFound();

    const idea = await this.ideaRepository.findOne({
      where: { id: ideaId }
    });
    
    if (!idea) throw new IdeaNotFound();

    const qb = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('author.user', 'user')
      .leftJoinAndSelect('comment.replies', 'replies')
      .leftJoinAndSelect('comment.likes', 'likes')
      .andWhere('comment.ideaId = :ideaId', { ideaId });

    if (!parentCommentId) {
      qb.andWhere('comment.parentCommentId IS NULL');
    } else {
      qb.andWhere('comment.parentCommentId = :parentCommentId', {
        parentCommentId,
      });
    }

    qb.skip(page * quantity).take(quantity);

    const [comments, total] = await qb.getManyAndCount();
    const pages = Math.ceil(total / quantity);
    const nextPage = page + 1;

    return {
      total,
      pages,
      page,
      nextPage: nextPage >= pages ? null : nextPage,
      data: comments.map((comment) => comment.toDto(req.user?.userProfileId)),
    };
  }
}

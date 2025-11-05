import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Request,
  Version,
} from '@nestjs/common';
import { GetCommentByIdInput } from './get-comments-by-id.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment, CommentDto } from 'src/entities/comment.entity';
import { CommentNotFound } from 'src/shared/errors';

@Controller('/comment')
export class GetCommentByIdController {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Get('/:id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  async getCommentById(
    @Request() req: RequestWithUserData,
    @Param() { id }: GetCommentByIdInput,
  ): Promise<CommentDto> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['author', 'author.user', 'replies', 'likes'],
    });
    if (!comment) throw new CommentNotFound();
    return comment.toDto(req.user?.userProfileId);
  }
}

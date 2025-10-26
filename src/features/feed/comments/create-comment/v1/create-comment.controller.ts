import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Request,
  Version,
} from '@nestjs/common';
import { CreateCommentInput } from './create-comment.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment, CommentDto } from 'src/entities/comment.entity';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { safeSave } from 'src/shared/utils/safe-save.util';

@Controller('/comment')
export class CreateCommentController {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Post()
  @Version('1')
  @Protected()
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Request() { user: { userProfileId: authorId } }: RequestWithUserData,
    @Body() { ideaId, parentCommentId, content }: CreateCommentInput,
  ): Promise<CommentDto> {
    const comment = await safeSave(this.commentRepository, {
      ideaId,
      content,
      parentCommentId,
      authorId,
    });
    return comment.toDto();
  }
}

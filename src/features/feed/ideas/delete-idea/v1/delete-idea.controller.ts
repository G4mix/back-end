import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import {
  Controller,
  Logger,
  Request,
  Version,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Idea } from 'src/entities/idea.entity';
import { IdeaNotFound, ThatIsNotYourIdea } from 'src/shared/errors';
import { DeleteIdeaInput } from './delete-idea.dto';
import { S3Gateway } from 'src/shared/gateways/s3.gateway';
import { ConfigService } from '@nestjs/config';
import { Protected } from 'src/shared/decorators/protected.decorator';

@Controller('/idea')
export class DeleteIdeaController {
  constructor(
    @InjectRepository(Idea)
    private readonly ideaRepository: Repository<Idea>,
    private readonly s3Gateway: S3Gateway,
    private readonly configService: ConfigService,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Delete('/:id')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Protected()
  async deleteIdea(
    @Request() req: RequestWithUserData,
    @Param() { id }: DeleteIdeaInput,
  ) {
    const idea = await this.ideaRepository.findOne({
      where: { id },
      relations: [
        'author',
        'author.user',
        'images',
        'tags',
        'comments',
        'likes',
        'views',
        'links',
      ],
    });
    if (!idea) throw new IdeaNotFound();
    if (idea.authorId !== req.user.userProfileId) throw new ThatIsNotYourIdea();

    await this.s3Gateway.deleteFolder(
      this.configService.get<string>('PUBLIC_BUCKET_NAME')!,
      `user-${req.user.sub}/ideas/${id}`,
    );
    await this.ideaRepository.delete(id);
  }
}

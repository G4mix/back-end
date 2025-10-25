import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Request,
  UploadedFiles,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import { UpdateIdeaInput } from './update-idea.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  S3Gateway,
  fileInterceptorOptions,
} from 'src/shared/gateways/s3.gateway';
import { ConfigService } from '@nestjs/config';
import { Idea, IdeaDto } from 'src/entities/idea.entity';
import { Tag } from 'src/entities/tag.entity';
import { AtLeastOneImage, IdeaNotFound } from 'src/shared/errors';
import { GetIdeaByIdInput } from '../../get-idea-by-id/v1/get-idea-by-id.dto';
import { safeSave } from 'src/shared/utils/safeSave';

@Controller('/idea')
export class UpdateIdeaController {
  constructor(
    @InjectRepository(Idea)
    private readonly ideaRepository: Repository<Idea>,
    private readonly configService: ConfigService,
    private readonly s3Gateway: S3Gateway,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Patch('/:id')
  @Version('1')
  @Protected()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('images', 8, fileInterceptorOptions))
  async createIdea(
    @Request() { user: { sub: id, userProfileId } }: RequestWithUserData,
    @Param() { id: ideaId }: GetIdeaByIdInput,
    @Body()
    { title, content, links, tags }: UpdateIdeaInput,
    @UploadedFiles() images: Express.Multer.File[],
  ): Promise<IdeaDto> {
    if (images.length === 0) throw new AtLeastOneImage();
    const idea = await this.ideaRepository.findOne({
      where: { id: ideaId },
      relations: [
        'author',
        'author.user',
        'tags',
        'comments',
        'likes',
        'views',
      ],
    });
    if (!idea) throw new IdeaNotFound();

    if (title) idea.title = title;
    if (content) idea.content = content;
    idea.authorId = userProfileId;

    if (links) {
      idea.links = links;
    }

    if (tags) {
      await this.ideaRepository.manager.delete(Tag, { ideaId: idea.id });

      const newTags = tags.map((tag) => {
        const newTag = new Tag();
        newTag.name = tag;
        newTag.ideaId = idea.id;
        return newTag;
      });
      idea.tags = newTags;
    }

    const newImages: string[] = [];
    for (const image of images ?? []) {
      const ideaImageRes = await this.s3Gateway.uploadFile({
        bucketName: this.configService.get<string>('PUBLIC_BUCKET_NAME')!,
        key: `user-${id}/ideas/${idea.id}/${image.originalname}`,
        file: image.buffer,
      });
      if (typeof ideaImageRes !== 'object') continue;
      newImages.push(ideaImageRes.fileUrl);
    }
    idea.images = newImages;

    await safeSave(this.ideaRepository, idea);
    return idea.toDto();
  }
}

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
import { Link } from 'src/entities/link.entity';
import { Tag } from 'src/entities/tag.entity';
import { Image } from 'src/entities/image.entity';
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
        'images',
        'tags',
        'comments',
        'likes',
        'views',
        'links',
      ],
    });
    if (!idea) throw new IdeaNotFound();

    if (title) idea.title = title;
    if (content) idea.content = content;
    idea.authorId = userProfileId;

    if (links) {
      await this.ideaRepository.manager.delete(Link, { ideaId: idea.id });

      const newLinks = links.map((link) => {
        const newLink = new Link();
        newLink.url = link;
        newLink.ideaId = idea.id;
        return newLink;
      });
      idea.links = newLinks;
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

    const newImages: Image[] = [];
    for (const image of images ?? []) {
      await this.ideaRepository.manager.delete(Image, { ideaId: idea.id });

      const ideaImageRes = await this.s3Gateway.uploadFile({
        bucketName: this.configService.get<string>('PUBLIC_BUCKET_NAME')!,
        key: `user-${id}/ideas/${idea.id}/${image.originalname}`,
        file: image.buffer,
      });
      if (typeof ideaImageRes !== 'object') continue;
      const newImage = new Image();
      newImage.alt = `Image ${image.originalname}`;
      newImage.src = ideaImageRes.fileUrl;
      newImage.ideaId = idea.id;
      newImages.push(newImage);
    }
    idea.images = newImages;

    await safeSave(this.ideaRepository, idea);
    return idea.toDto();
  }
}

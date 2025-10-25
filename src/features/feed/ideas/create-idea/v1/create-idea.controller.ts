import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Request,
  UploadedFiles,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import { CreateIdeaInput } from './create-idea.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  S3Gateway,
  fileInterceptorOptions,
} from 'src/shared/gateways/s3.gateway';
import { ConfigService } from '@nestjs/config';
import { Idea, IdeaDto } from 'src/entities/idea.entity';
import { Tag } from 'src/entities/tag.entity';
import { AtLeastOneImage } from 'src/shared/errors';
import { safeSave } from 'src/shared/utils/safeSave';

@Controller('/idea')
export class CreateIdeaController {
  constructor(
    @InjectRepository(Idea)
    private readonly ideaRepository: Repository<Idea>,
    private readonly configService: ConfigService,
    private readonly s3Gateway: S3Gateway,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Post()
  @Version('1')
  @Protected()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('images', 8, fileInterceptorOptions))
  async createIdea(
    @Request() { user: { sub: id, userProfileId } }: RequestWithUserData,
    @Body()
    { title, content, links, tags }: CreateIdeaInput,
    @UploadedFiles() images: Express.Multer.File[],
  ): Promise<IdeaDto> {
    if (images.length === 0) throw new AtLeastOneImage();
    const newIdea = new Idea();
    newIdea.title = title;
    newIdea.content = content;
    newIdea.authorId = userProfileId;

    newIdea.links = links ?? [];

    const newTags = tags?.map((tag) => {
      const newTag = new Tag();
      newTag.name = tag;
      return newTag;
    });
    newIdea.tags = newTags ?? [];

    const idea = await safeSave(this.ideaRepository, newIdea);
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

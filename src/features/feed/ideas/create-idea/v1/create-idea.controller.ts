import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Request,
  UploadedFiles,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Idea, IdeaDto } from 'src/entities/idea.entity';
import { Project } from 'src/entities/project.entity';
import { Tag } from 'src/entities/tag.entity';
import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { AtLeastOneImage, ProjectNotFound } from 'src/shared/errors';
import {
  S3Gateway,
  fileInterceptorOptions,
} from 'src/shared/gateways/s3.gateway';
import { safeSave } from 'src/shared/utils/safe-save.util';
import { Repository } from 'typeorm';
import { CreateIdeaInput, CreateIdeaQueryInput } from './create-idea.dto';

@Controller('/idea')
export class CreateIdeaController {
  constructor(
    @InjectRepository(Idea)
    private readonly ideaRepository: Repository<Idea>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
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
    @Query() { projectId }: CreateIdeaQueryInput,
    @Body()
    { title, content, links, tags }: CreateIdeaInput,
    @UploadedFiles() images: Express.Multer.File[],
  ): Promise<IdeaDto> {
    if (images.length === 0) throw new AtLeastOneImage();
    const newIdea = new Idea();
    newIdea.title = title;
    newIdea.content = content;
    newIdea.authorId = userProfileId;

    if (projectId) {
      const project = await this.projectRepository.findOne({
        where: { id: projectId },
      });
      if (!project) throw new ProjectNotFound();
      newIdea.projectId = project.id;
    }

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

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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { RequestWithUserData } from 'src/jwt/jwt.strategy';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { PictureUpdateFail, YouAreNotTheOwner } from 'src/shared/errors';
import { Project, ProjectDto } from 'src/entities/project.entity';
import {
  UpdateProjectInput,
  UpdateProjectParamsInput,
} from './update-project.dto';
import {
  fileInterceptorOptions,
  S3Gateway,
  SUPPORTED_IMAGES,
} from 'src/shared/gateways/s3.gateway';
import { ConfigService } from '@nestjs/config';
import { safeSave } from 'src/shared/utils/safe-save.util';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@Controller('/project')
export class UpdateProjectController {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly configService: ConfigService,
    private readonly s3Gateway: S3Gateway,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Patch()
  @Version('1')
  @Protected()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'icon', maxCount: 1 },
        { name: 'backgroundImage', maxCount: 1 },
      ],
      fileInterceptorOptions,
    ),
  )
  async updateProject(
    @Request() { user: { sub: id, userProfileId } }: RequestWithUserData,
    @Param() { projectId }: UpdateProjectParamsInput,
    @Body() { title, description }: UpdateProjectInput,
    @UploadedFiles()
    files: {
      icon?: Express.Multer.File[];
      backgroundImage?: Express.Multer.File[];
    },
  ): Promise<ProjectDto> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (project?.ownerId !== userProfileId) throw new YouAreNotTheOwner();

    const icon = files.icon?.[0];
    const backgroundImage = files.backgroundImage?.[0];

    if (icon) {
      const projectIconRes = await this.s3Gateway.uploadFile({
        bucketName: this.configService.get<string>('PUBLIC_BUCKET_NAME')!,
        key: `user-${id}/project-${projectId}/icon${SUPPORTED_IMAGES[icon.mimetype as keyof typeof SUPPORTED_IMAGES]}`,
        file: icon.buffer,
      });
      if (typeof projectIconRes !== 'object') throw new PictureUpdateFail();
      if (projectIconRes.fileUrl) project.icon = projectIconRes.fileUrl;
    }

    if (backgroundImage) {
      const projectbackgroundImageRes = await this.s3Gateway.uploadFile({
        bucketName: this.configService.get<string>('PUBLIC_BUCKET_NAME')!,
        key: `user-${id}/project-${projectId}/backgroundImage${SUPPORTED_IMAGES[backgroundImage.mimetype as keyof typeof SUPPORTED_IMAGES]}`,
        file: backgroundImage.buffer,
      });
      if (typeof projectbackgroundImageRes !== 'object') {
        throw new PictureUpdateFail();
      }
      if (projectbackgroundImageRes.fileUrl) {
        project.backgroundImage = projectbackgroundImageRes.fileUrl;
      }
    }

    Object.assign(project, title && { title }, description && { description });

    await safeSave(this.projectRepository, project);

    return project.toDto();
  }
}

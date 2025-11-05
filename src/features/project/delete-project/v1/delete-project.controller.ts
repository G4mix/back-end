import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Request,
  Version,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from 'src/entities/project.entity';
import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { ProjectNotFound, YouAreNotTheOwner } from 'src/shared/errors';
import { S3Gateway } from 'src/shared/gateways/s3.gateway';
import { Repository } from 'typeorm';
import { DeleteProjectInput } from './delete-project.dto';

@Controller('/project')
export class DeleteProjectController {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly s3Gateway: S3Gateway,
    private readonly configService: ConfigService,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Delete('/:projectId')
  @Version('1')
  @Protected()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProject(
    @Request() req: RequestWithUserData,
    @Param() { projectId }: DeleteProjectInput,
  ): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) throw new ProjectNotFound();
    if (project.ownerId !== req.user.userProfileId) {
      throw new YouAreNotTheOwner();
    }

    await this.s3Gateway.deleteFolder(
      this.configService.get<string>('PUBLIC_BUCKET_NAME')!,
      `user-${req.user.sub}/project-${projectId}`,
    );
    await this.projectRepository.delete(projectId);
  }
}

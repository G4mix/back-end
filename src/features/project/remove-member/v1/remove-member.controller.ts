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
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Chat } from 'src/entities/chat.entity';
import { Project } from 'src/entities/project.entity';
import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import { Protected } from 'src/shared/decorators/protected.decorator';
import {
  ProjectNotFound,
  UserNotFound,
  YouAreNotTheOwner,
  YouCannotRemoveTheOwner,
} from 'src/shared/errors';
import { DataSource, Repository } from 'typeorm';
import { RemoveMemberInput } from './remove-member.dto';

@Controller('/project')
export class RemoveMemberController {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Delete('/:projectId/member/:memberId')
  @Version('1')
  @Protected()
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Request() req: RequestWithUserData,
    @Param() { projectId, memberId }: RemoveMemberInput,
  ): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) throw new ProjectNotFound();
    else if (project.ownerId !== req.user.userProfileId) {
      throw new YouAreNotTheOwner();
    } else if (memberId === project.ownerId) {
      throw new YouCannotRemoveTheOwner();
    }

    const memberExists = await this.dataSource.query(
      `SELECT 1 FROM project_members WHERE project_id = $1::uuid AND profile_id = $2::uuid LIMIT 1`,
      [projectId, memberId],
    );
    if (memberExists.length === 0) throw new UserNotFound();

    await this.projectRepository
      .createQueryBuilder()
      .relation(Project, 'members')
      .of(project)
      .remove(memberId);

    if (project.chatId) {
      await this.chatRepository
        .createQueryBuilder()
        .relation(Chat, 'members')
        .of(project.chatId)
        .remove(memberId);
    }
  }
}

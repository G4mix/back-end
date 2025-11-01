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
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Follow } from 'src/entities/follow.entity';
import { Profile } from 'src/entities/profile.entity';
import { Project, ProjectDto } from 'src/entities/project.entity';
import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import { ProjectNotFound } from 'src/shared/errors';
import { DataSource, Repository } from 'typeorm';
import { GetProjectInput } from './get-project.dto';

@Controller('/project')
export class GetProjectController {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Get('/:projectId')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  async getProject(
    @Request() req: RequestWithUserData,
    @Param() { projectId }: GetProjectInput,
  ): Promise<ProjectDto> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['owner', 'owner.user', 'posts'],
    });

    if (!project) throw new ProjectNotFound();

    const topFollowersRaw = await this.dataSource.query(
      `
      WITH follower_counts AS (
        SELECT 
          following_user_id as user_id,
          COUNT(*) as count
        FROM follows
        GROUP BY following_user_id
      ),
      ranked_follows AS (
        SELECT 
          f.id,
          f.follower_user_id,
          p.display_name,
          p.icon,
          COALESCE(fc.count, 0) as follower_count,
          ROW_NUMBER() OVER (
            ORDER BY COALESCE(fc.count, 0) DESC
          ) as rn
        FROM follows f
        INNER JOIN profiles p ON p.id = f.follower_user_id
        LEFT JOIN follower_counts fc ON fc.user_id = f.follower_user_id
        WHERE f.following_project_id = $1::uuid
      )
      SELECT 
        id,
        follower_user_id as "followerUserId",
        display_name as "displayName",
        icon
      FROM ranked_follows
      WHERE rn <= 3
      ORDER BY rn
    `,
      [projectId],
    );

    project.followers = (
      topFollowersRaw as Array<{
        displayName: string;
        icon: string | null;
      }>
    ).map((row) => {
      const follow = new Follow();
      follow.followerUser = {
        displayName: row.displayName,
        icon: row.icon,
      } as Profile;
      return follow;
    });

    return project.toDto();
  }
}

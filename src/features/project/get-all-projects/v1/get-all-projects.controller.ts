import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
  Request,
  Version,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Follow } from 'src/entities/follow.entity';
import { Profile } from 'src/entities/profile.entity';
import { Project } from 'src/entities/project.entity';
import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import { DataSource, Repository } from 'typeorm';
import {
  GetAllProjectsInput,
  GetAllProjectsOutput,
} from './get-all-projects.dto';

@Controller('/project')
export class GetAllProjectsController {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  async getAllProjects(
    @Request() req: RequestWithUserData,
    @Query() { search, quantity, page }: GetAllProjectsInput,
  ): Promise<GetAllProjectsOutput> {
    const qb = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner')
      .leftJoinAndSelect('owner.user', 'user')
      .leftJoinAndSelect('project.posts', 'posts');

    if (search && search.trim() !== '') {
      qb.andWhere(
        '(project.title ILIKE :search OR project.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.skip(page * quantity).take(quantity);

    const [projects, total] = await qb.getManyAndCount();
    const pages = Math.ceil(total / quantity);
    const nextPage = page + 1;

    if (projects.length > 0) {
      const projectIds = projects.map((p) => p.id);

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
            f.following_project_id,
            f.follower_user_id,
            p.display_name,
            p.icon,
            COALESCE(fc.count, 0) as follower_count,
            ROW_NUMBER() OVER (
              PARTITION BY f.following_project_id 
              ORDER BY COALESCE(fc.count, 0) DESC
            ) as rn
          FROM follows f
          INNER JOIN profiles p ON p.id = f.follower_user_id
          LEFT JOIN follower_counts fc ON fc.user_id = f.follower_user_id
          WHERE f.following_project_id = ANY($1::uuid[])
        )
        SELECT 
          id,
          following_project_id as "followingProjectId",
          follower_user_id as "followerUserId",
          display_name as "displayName",
          icon
        FROM ranked_follows
        WHERE rn <= 3
        ORDER BY following_project_id, rn
      `,
        [projectIds],
      );

      const topFollowersByProject = new Map<
        string,
        Array<{ name: string; icon: string | null }>
      >();

      for (const row of topFollowersRaw as Array<{
        followingProjectId: string;
        displayName: string;
        icon: string | null;
      }>) {
        const projectId = row.followingProjectId;
        if (!topFollowersByProject.has(projectId)) {
          topFollowersByProject.set(projectId, []);
        }
        topFollowersByProject.get(projectId)!.push({
          name: row.displayName,
          icon: row.icon,
        });
      }

      for (const project of projects) {
        const topFollowers = topFollowersByProject.get(project.id) ?? [];
        project.followers = topFollowers.map((tf) => {
          const follow = new Follow();
          follow.followerUser = {
            displayName: tf.name,
            icon: tf.icon,
          } as Profile;
          return follow;
        }) as any;
      }
    }

    return {
      total,
      pages,
      page,
      nextPage: nextPage >= pages ? null : nextPage,
      data: projects.map((project) => project.toDto()),
    };
  }
}

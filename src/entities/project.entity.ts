import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Chat } from './chat.entity';
import { Follow } from './follow.entity';
import { Idea } from './idea.entity';
import { Profile, ProfileDto } from './profile.entity';

@Entity('project')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, default: 'Default title' })
  title: string;

  @Column({ length: 300, default: 'Default description' })
  description: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  icon: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  backgroundImage: string | null;

  @Column()
  @Index()
  ownerId: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: Profile;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  chatId: string | null;

  @OneToOne(() => Chat, {
    nullable: true,
    cascade: true,
  })
  @JoinColumn({ name: 'chat_id' })
  chat: Chat;

  @ManyToMany(() => Profile, { cascade: true })
  @JoinTable({
    name: 'project_members',
    joinColumn: { name: 'project_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'profile_id', referencedColumnName: 'id' },
  })
  members: Profile[];

  @OneToMany(() => Idea, (idea) => idea.project, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  posts: Idea[];

  @OneToMany(() => Follow, (follow) => follow.followingProject, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  followers: Follow[];

  toDto(currentUserId?: string, isFollowingOverride?: boolean): ProjectDto {
    const project = new ProjectDto();
    project.id = this.id;
    project.title = this.title;
    project.description = this.description;
    project.icon = this.icon;
    project.backgroundImage = this.backgroundImage;
    project.ownerId = this.ownerId;
    project.createdAt = this.createdAt;
    project.followersCount = this.followers?.length ?? 0;
    project.ideasCount = this.posts?.length ?? 0;

    project.topFollowers =
      this.followers
        ?.filter((follow) => follow.followerUser)
        .map((follow) => ({
          name: follow.followerUser.displayName,
          icon: follow.followerUser.icon,
        })) ?? [];

    project.isOwner = currentUserId ? this.ownerId === currentUserId : false;
    project.isFollowing =
      isFollowingOverride !== undefined
        ? isFollowingOverride
        : currentUserId
          ? (this.followers?.some(
              (follow) => follow.followerUserId === currentUserId,
            ) ?? false)
          : false;
    project.isMember = currentUserId
      ? (this.members?.some((member) => member.id === currentUserId) ?? false)
      : false;

    project.owner = this.owner?.toDto(currentUserId);

    if (project.isOwner && this.members) {
      project.members = this.members.map((member) =>
        member.toDto(currentUserId),
      );
    } else {
      project.members = null;
    }

    return project;
  }
}

export class ProjectDto {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  backgroundImage: string | null;
  ownerId: string;
  createdAt: Date;
  followersCount: number;
  ideasCount: number;
  topFollowers: Array<{ name: string; icon: string | null }>;
  isFollowing: boolean;
  isOwner: boolean;
  isMember: boolean;
  owner?: ProfileDto;
  members: ProfileDto[] | null;
}

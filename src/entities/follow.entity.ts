import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Profile } from './profile.entity';
import { Project } from './project.entity';

@Entity('follows')
@Unique(['followerUserId', 'followingUserId'])
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  followerUserId: string;

  @Column({ nullable: true })
  followingUserId: string | null;

  @Column({ nullable: true })
  followingProjectId: string | null;

  @ManyToOne(() => Profile, (profile) => profile.following, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'follower_user_id' })
  followerUser: Profile;

  @ManyToOne(() => Profile, (profile) => profile.followers, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'following_user_id' })
  followingUser: Profile;

  @ManyToOne(() => Project, (project) => project.followers, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'following_project_id' })
  followingProject: Project;

  @CreateDateColumn()
  createdAt: Date;
}

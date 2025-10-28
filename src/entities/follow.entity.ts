import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
  JoinColumn,
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

  @Column()
  followingUserId: string;

  @Column()
  followingProjectId: string;

  @ManyToOne(() => Profile, (profile) => profile.following, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'follower_user_id' })
  followerUser: Profile;

  @ManyToOne(() => Profile, (profile) => profile.followers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'following_user_id' })
  followingUser: Profile;

  @ManyToOne(() => Project, (project) => project.followers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'following_project_id' })
  followingProject: Project;

  @CreateDateColumn()
  createdAt: Date;
}

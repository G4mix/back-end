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
import { Profile } from './profile.entity';
import { Idea } from './idea.entity';
import { Follow } from './follow.entity';
import { Chat } from './chat.entity';

@Entity('project')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  title: string;

  @Column({ length: 300 })
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

  @OneToOne(() => Chat, {
    nullable: true,
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

  toDto(): ProjectDto {
    const project = new ProjectDto();
    project.title = this.title;
    project.description = this.description;
    project.icon = this.icon;
    project.backgroundImage = this.backgroundImage;
    return project;
  }
}

export class ProjectDto {
  title: string;
  description: string;
  icon: string | null;
  backgroundImage: string | null;
}

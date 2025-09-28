import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserProfile } from './user-profile.entity';
import { Idea } from './idea.entity';

@Entity('links')
export class Link {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @Index()
  ideaId: string | null;

  @Column({ length: 700 })
  url: string;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.links, {
    onDelete: 'CASCADE',
  })
  userProfile: UserProfile;

  @ManyToOne(() => Idea, (idea) => idea.links, {
    onDelete: 'CASCADE',
  })
  idea: Idea;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
